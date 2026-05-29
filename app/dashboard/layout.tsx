import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { ChatSheet } from "@/components/chat-sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <ChatSheet />
    </TooltipProvider>
  )
}
