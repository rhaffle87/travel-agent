import { OAuthProvider, Query } from "appwrite";
import { account, appwriteConfig, database } from "./client";
import { redirect } from "react-router";

export const getAuthErrorMessage = (error: any): string => {
    if (!error) return "An unknown error occurred.";

    const code = error.code || error.status;
    const message = error.message || error.toString();

    switch (code) {
        case 401:
            return "Authentication failed. Please log in again.";
        case 403:
            return "Access denied. You don't have permission to perform this action.";
        case 404:
            return "Resource not found. Please check your request.";
        case 409:
            return "Conflict occurred. The resource already exists.";
        case 429:
            return "Too many requests. Please try again later.";
        case 500:
            return "Server error. Please try again later.";
        default:
            if (message.includes("network") || message.includes("fetch")) {
                return "Network error. Please check your internet connection.";
            }
            if (message.includes("OAuth") || message.includes("Google")) {
                return "Google authentication failed. Please try again.";
            }
            return `An error occurred: ${message}`;
    }
};

export const loginwithGoogle = async () => {
    try {
        await account.createOAuth2Session(OAuthProvider.Google);
        // Note: This will redirect to Google for authentication
    } catch (e) {
        const errorMessage = getAuthErrorMessage(e);
        console.log('LoginWithGoogle:', errorMessage);
        throw new Error(errorMessage);
    }
};

export const getUser = async () => {
    try {
        const user = await account.get();

        if (!user) {
            return redirect('/sign-in');
        }

        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId!,
            appwriteConfig.usersTableId!,
            [
                Query.equal('accountId', user.$id),
                Query.select(['name', 'email', 'imageUrl', 'joinedAt', 'accountId']),
            ]
        );

        return documents[0] || null; // Return the first matching document or null
    } catch (e) {
        const errorMessage = getAuthErrorMessage(e);
        console.log('getUser:', errorMessage);
        return null;
    }
};

export const logoutUser = async () => {
    try {
        await account.deleteSession('current');
        return true; // Indicate successful logout
    } catch (e) {
        const errorMessage = getAuthErrorMessage(e);
        console.log('logoutUser:', errorMessage);
        return false;
    }
};

export const getGooglePicture = async (): Promise<string | null> => {
    try {
        // Get the current session to extract the Google OAuth access token
        const sessions = await account.listSessions();
        const googleSession = sessions.sessions.find((s: any) => s.provider === 'google');
        const accessToken = googleSession?.providerAccessToken;
        if (!accessToken) return null;

        // Fetch profile info from Google People API
        const response = await fetch(
            'https://people.googleapis.com/v1/people/me?personFields=photos',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        if (!response.ok) return null;
        const data = await response.json();
        const photoUrl = data.photos?.[0]?.url || null;
        return photoUrl;
    } catch (e) {
        const errorMessage = getAuthErrorMessage(e);
        console.log('getGooglePicture:', errorMessage);
        return null;
    }
};

export const storeUserData = async (userData: { name: string; email: string; imageUrl?: string }) => {
    try {
        const user = await account.get();
        if (!user) throw new Error('No authenticated user');

        // Check if user already exists
        const existing = await getExistingUser();
        if (existing) return existing; // Already stored

        // Create new user document
        const newUser = await database.createDocument(
            appwriteConfig.databaseId!,
            appwriteConfig.usersTableId!,
            user.$id, // Use account ID as document ID
            {
                accountId: user.$id,
                name: userData.name,
                email: userData.email,
                imageUrl: userData.imageUrl || null,
                joinedAt: new Date().toISOString(),
            }
        );
        return newUser;
    } catch (e) {
        const errorMessage = getAuthErrorMessage(e);
        console.log('storeUserData:', errorMessage);
        return null;
    }
};

export const getExistingUser = async () => {
    try {
        const user = await account.get();
        if (!user) return null;

        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId!,
            appwriteConfig.usersTableId!,
            [Query.equal('accountId', user.$id)]
        );
        return documents[0] || null;
    } catch (e) {
        const errorMessage = getAuthErrorMessage(e);
        console.log('getExistingUser:', errorMessage);
        return null;
    }
};

