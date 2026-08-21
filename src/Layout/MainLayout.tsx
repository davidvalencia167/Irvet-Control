import Header from "../Components/Header/Header";
import Slidebar from "../Components/Slidebar/Slidebar";
import type { Orden } from "../types/index";

interface MainLayoutProps {
    ordenes: Orden[];
    editingId: string | null;
    onNewOrder: () => void;
    children: React.ReactNode;
}

export default function MainLayout({ ordenes, editingId, onNewOrder, children }: MainLayoutProps) {
    return(
        <div className="flex h-screen overflow-hidden" style={{fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#EEF2F7"}}>
            <Slidebar totalOrdenes={ordenes.length}/>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header editingId={editingId} onNewOrder={onNewOrder}/>
                <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {children}
                    <div className="h-4"/>
                </main>
            </div>
        </div>
    );
}