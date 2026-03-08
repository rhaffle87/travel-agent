import { Outlet, redirect } from "react-router";
import { getCurrentUser, getExistingUser, storeUserData } from "~/appwrite/auth";
import RootNavbar from "../../../components/RootNavbar";

export async function clientLoader() {
    try {
        const user = await getCurrentUser();

        if (!user) return redirect('/sign-in');

        const existingUser = await getExistingUser(user.$id);
        return existingUser?.$id ? existingUser : await storeUserData();
    } catch (e) {
        console.log('Error fetching user', e)
        return redirect('/sign-in')
    }
}

const PageLayout = () => {
    return (
        <div className="bg-light-200">
            <RootNavbar />
            <Outlet />
        </div>
    )
}
export default PageLayout