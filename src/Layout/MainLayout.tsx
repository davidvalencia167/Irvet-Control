import type { ReactNode } from "react";
import Header from "../Components/Header/Header";
import Slidebar, { type SidebarItem } from "../Components/Slidebar/Slidebar";
import type { Orden } from "../types/index";

interface MainLayoutProps {
    ordenes: Orden[];
    editingId?: string | null;
    onNewOrder?: () => void;
    children: ReactNode;
    title?: string;
    showNewOrderButton?: boolean;
    sidebarItems?: SidebarItem[];
    activeModule?: string;
    onSelectModule?: (moduleKey: string) => void;
}

export default function MainLayout({
    ordenes,
    editingId = null,
    onNewOrder,
    children,
    title,
    showNewOrderButton = true,
    sidebarItems,
    activeModule,
    onSelectModule,
}: MainLayoutProps) {
    return(
        <div className="flex h-screen overflow-hidden" style={{fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#EEF2F7"}}>
            <Slidebar
                totalOrdenes={ordenes.length}
                items={sidebarItems}
                activeModule={activeModule}
                onSelectModule={onSelectModule}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    editingId={editingId}
                    onNewOrder={onNewOrder}
                    title={title}
                    showNewOrderButton={showNewOrderButton}
                />
                <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {children}
                    <div className="h-4"/>
                </main>
            </div>
        </div>
    );
}