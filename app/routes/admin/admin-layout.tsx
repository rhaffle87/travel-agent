import { Outlet, redirect } from "react-router";
import { SidebarComponent } from "@syncfusion/ej2-react-navigations";
import { MobileSidebar, NavItems } from "../../../components";
import { account } from "~/appwrite/client";
import { getExistingUser, storeUserData } from "~/appwrite/auth";

// admin-layout.tsx
export async function clientLoader() {
    try {
        const user = await account.get().catch(() => null);

        if (!user) {
            return redirect('/sign-in');
        }

        const existingUser = await getExistingUser(user.$id);

        if (existingUser?.status === 'user') {
            return redirect('/');
        }

        return existingUser?.$id ? existingUser : await storeUserData();
    } catch (e) {
        return redirect('/sign-in');
    }
}

const AdminLayout = () => {
    return (
        <div className="admin-layout">
            <MobileSidebar />

            <aside className="w-full max-w-67.5 hidden lg:block">
                <SidebarComponent width={270} enableGestures={false}>
                    <NavItems />
                </SidebarComponent>
            </aside>

            <aside className="children">
                <Outlet />
            </aside>
        </div>
    )
}
export default AdminLayout