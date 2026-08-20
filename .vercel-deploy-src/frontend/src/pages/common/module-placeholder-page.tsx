import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'

function ModulePlaceholderPage({ title, description, emptyTitle, icon }: { title: string; description: string; emptyTitle: string; icon: LucideIcon }) { return <PageLayout className="bg-[#F7F8FA]"><PageContainer><div className="space-y-6 pb-10"><PageHeader><PageHeading><PageTitle>{title}</PageTitle><PageDescription>{description}</PageDescription></PageHeading></PageHeader><EmptyState title={emptyTitle} description="This workspace is ready for your first setup." icon={icon} /></div></PageContainer></PageLayout> }
export default ModulePlaceholderPage
