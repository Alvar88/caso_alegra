import { supabase } from '@/lib/supabase'
import PipelineKanban from '@/components/PipelineKanban'

export const revalidate = 60

export default async function PipelinePage() {
  const { data: deals } = await supabase
    .from('deals')
    .select('*, contact:contacts(first_name, last_name, country, company_id), rep:reps(avatar)')
    .order('updated_at', { ascending: false })

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')

  return <PipelineKanban deals={deals ?? []} companies={companies ?? []} />
}
