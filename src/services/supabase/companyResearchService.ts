import { supabase } from '../../lib/supabase';
import { CompanyResearchData, VerifiedSource, VerifiedFact, StrategicInference } from '../../types/companyResearch';
import { Json } from '../../types/database.types';

export const companyResearchService = {
  /**
   * Retrieves existing research for the given company and role if researched recently.
   */
  async getCachedResearch(companyName: string, role?: string): Promise<CompanyResearchData | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const cleanCompany = companyName.trim();
    if (!cleanCompany) return null;

    let query = supabase
      .from('company_research')
      .select('*')
      .eq('user_id', user.id)
      .ilike('company_name', cleanCompany)
      .order('researched_at', { ascending: false })
      .limit(1);

    if (role && role.trim()) {
      query = query.ilike('role', role.trim());
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      role: data.role,
      overview: data.overview || '',
      products: (data.products as unknown as string[]) || [],
      businessModel: data.business_model || '',
      verifiedFacts: (data.verified_facts as unknown as VerifiedFact[]) || [],
      strategicInferences: (data.strategic_inferences as unknown as StrategicInference[]) || [],
      unavailableInformation: (data.unavailable_information as unknown as string[]) || [],
      sources: (data.sources as unknown as VerifiedSource[]) || [],
      status: (data.status as CompanyResearchData['status']) || 'completed',
      researchedAt: data.researched_at,
    };
  },

  /**
   * Saves or updates company research data in public.company_research with user RLS.
   */
  async saveCompanyResearch(data: CompanyResearchData): Promise<CompanyResearchData> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required to save company intelligence.');
    }

    const researchId = data.id || crypto.randomUUID();

    const { data: inserted, error } = await supabase
      .from('company_research')
      .upsert({
        id: researchId,
        user_id: user.id,
        company_name: data.companyName.trim(),
        role: data.role.trim(),
        overview: data.overview,
        products: (data.products as unknown as Json) || null,
        business_model: data.businessModel,
        verified_facts: (data.verifiedFacts as unknown as Json) || null,
        strategic_inferences: (data.strategicInferences as unknown as Json) || null,
        unavailable_information: (data.unavailableInformation as unknown as Json) || null,
        sources: (data.sources as unknown as Json) || null,
        status: data.status || 'completed',
        researched_at: data.researchedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving company research in Supabase:', error);
      throw new Error(`Failed to save company research: ${error.message}`);
    }

    return {
      id: inserted.id,
      userId: inserted.user_id,
      companyName: inserted.company_name,
      role: inserted.role,
      overview: inserted.overview || '',
      products: (inserted.products as unknown as string[]) || [],
      businessModel: inserted.business_model || '',
      verifiedFacts: (inserted.verified_facts as unknown as VerifiedFact[]) || [],
      strategicInferences: (inserted.strategic_inferences as unknown as StrategicInference[]) || [],
      unavailableInformation: (inserted.unavailable_information as unknown as string[]) || [],
      sources: (inserted.sources as unknown as VerifiedSource[]) || [],
      status: (inserted.status as CompanyResearchData['status']) || 'completed',
      researchedAt: inserted.researched_at,
    };
  },
};
