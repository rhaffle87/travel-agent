import { Link, NavLink, useLoaderData, useNavigate } from "react-router";
import { logoutUser } from "~/appwrite/auth";
import { sidebarItems } from "~/constants";
import { cn } from "~/lib/utils";
import { Avatars } from "appwrite";
import { client } from "~/appwrite/client";

const avatars = new Avatars(client);

type UserData = {
  name: string;
  email: string;
};

const NavItems = ({ handleClick }: { handleClick?: () => void }) => {
  const user = useLoaderData() as UserData;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/sign-in");
  };

  const avatarUrl = avatars.getInitials(user.name, 128, 128);

  return (
    <section className="nav-items">
      <Link to="/" className="link-logo">
        <img src="/assets/icons/logo.svg" alt="Logo" className="size-7.5" />
        <h1>Tourvisto</h1>
      </Link>

      <div className="container">
        <nav>
          {sidebarItems.map(({ id, href, icon, label }) => (
            <NavLink to={href} key={id}>
              {({ isActive }) => (
                <div
                  className={cn("group nav-item", {
                    "bg-primary-100 text-white!": isActive,
                  })}
                  onClick={handleClick}
                >
                  <img
                    src={icon}
                    alt={label}
                    className={`group-hover:brightness-0 size-0 group-hover:invert ${
                      isActive ? "brightness-0 invert" : "text-dark-200"
                    }`}
                  />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <footer className="nav-footer">
          <img
            src={avatarUrl}
            alt={user.name}
            className="size-10 rounded-full"
          />
          <article>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </article>
          <button onClick={handleLogout} className="cursor-pointer">
            <img
              src="/assets/icons/logout.svg"
              alt="logout"
              className="size-6"
            />
          </button>
        </footer>
      </div>
    </section>
  );
};

export default NavItems;