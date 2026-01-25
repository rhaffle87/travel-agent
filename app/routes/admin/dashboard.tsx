import { Header } from "components";

const Dashboard = () => {

  const user = { name: 'David Doe' };
  return (
    <main className="dashboard wrapper">
      <Header
        title={`Welcome back, ${user.name ?? 'Guest'} 👋`}
        description="Here's what's happening with your account today." 
      />

      Dashboard Page Contents

    </main>
  )
}

export default Dashboard