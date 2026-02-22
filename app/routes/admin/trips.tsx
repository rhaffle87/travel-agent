import { Header } from "components"

const Trips = () => {
  return (
    <main className="all-users wrapper">
      <Header
        title='Manage Users'
        description="View and edit AI-Generated travel plans." 
        ctaText="Create a trip"
        ctaUrl="/trips/create"
      />
    </main>
  )
}

export default Trips