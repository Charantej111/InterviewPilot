import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { interviewId, apiKey } = await req.json();
    if (!interviewId) {
      return new Response(JSON.stringify({ error: 'Missing interviewId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseAnonKey;
    const geminiApiKey = apiKey || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your Supabase project secrets or .env.');
    }

    // 1. Authenticate user from JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate interview ownership against database
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: interview, error: intError } = await adminSupabase
      .from('interviews')
      .select(`
        *,
        questions (*),
        resumes (*),
        job_descriptions (*),
        company_research (*)
      `)
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single();

    if (intError || !interview) {
      return new Response(JSON.stringify({ error: 'Interview session not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Assemble rolling conversational context & system instruction
    const currentQ = (interview.questions || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order)[interview.current_question_index || 0];
    const candidateName = interview.resumes?.extracted_profile?.name || 'Candidate';
    const role = interview.target_role;
    const company = interview.company;
    const style = interview.interview_style || 'realistic';
    const difficulty = interview.difficulty || 'intermediate';

    const systemInstruction = `You are a high-caliber professional executive interviewer conducting a live conversational interview with ${candidateName} for the ${role} position at ${company}.

Interview Configuration:
- Difficulty Level: ${difficulty}
- Interview Style: ${style} (Maintain a professional, engaging, and rigorous standard)
- Target Role: ${role}
- Target Company: ${company}

INTERVIEWER BEHAVIOR RULES:
1. Speak naturally, concisely, and conversationally.
2. Ask one clear question at a time.
3. Listen attentively to the candidate's responses.
4. If candidate speaks or interrupts, stop speaking immediately and acknowledge their statement.
5. If the candidate's answer is vague or misses critical technical trade-offs/metrics, ask a sharp, targeted follow-up.
6. When transitioning questions, provide brief natural bridge context.
7. STRICT ZERO-COACHING RULE DURING INTERVIEW: Do NOT give feedback scores, do NOT reveal hidden rubric ratings, and NEVER give sample answers during the live interview.
8. Be concise and avoid repetitive filler phrases like "Great answer!".`;

    const voiceSessionId = `vses_${crypto.randomUUID()}`;

    // 4. Update interview voice status in DB
    await adminSupabase
      .from('interviews')
      .update({
        mode: 'voice',
        voice_provider: 'gemini_live',
        voice_session_id: voiceSessionId,
        voice_status: 'connected',
      })
      .eq('id', interviewId);

    // 5. Return short-lived session configuration (Permanent API key stays on server)
    const sessionConfig = {
      voiceSessionId,
      interviewId,
      provider: 'gemini_live',
      model: 'gemini-3.5-flash',
      systemInstruction,
      initialQuestion: currentQ ? {
        id: currentQ.id,
        order: currentQ.sequence_order,
        text: currentQ.question_text,
        category: currentQ.category,
        intent: currentQ.intent,
      } : null,
      timeLimitMinutes: interview.duration_minutes || 20,
      candidateName,
      targetRole: role,
      company,
      voiceConfig: {
        voiceName: 'Aoede', // Natural conversational voice timbre
      },
    };

    return new Response(JSON.stringify({ sessionConfig }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in create-voice-session Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
