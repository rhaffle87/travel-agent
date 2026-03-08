import { Header } from "components"
import { ComboBoxComponent } from "@syncfusion/ej2-react-dropdowns"
import type { Route } from "./+types/create-trip"
import { useRef, useState } from "react";
import { comboBoxItems, selectItems } from "~/constants";
import { cn, formatKey } from "~/lib/utils";
import { MapsComponent, LayersDirective, LayerDirective } from "@syncfusion/ej2-react-maps"
import { world_map } from "~/constants/world_map";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { useNavigate } from "react-router";
import { getCurrentUser } from "~/appwrite/auth";

export const loader = async () => {
  const response = await fetch("https://restcountries.com/v3.1/all?fields=flags,name,latlng,maps");

  const data = await response.json();

  const arrayData = Array.isArray(data) ? data : [];

  return arrayData.map((country: any) => ({
    name: country.name.common,
    flag: country.flags?.svg || country.flags?.png,
    coordinates: country.latlng,
    value: country.name.common,
    openStreetMap: country.maps?.openStreetMap,
  }));
};

const CreateTrip = ( { loaderData } : Route.ComponentProps) => {
  const countries = loaderData as Country[];

  const navigate = useNavigate()

  const [formData, setFormData] = useState<TripFormData>({
    country: countries[0]?.name || '',
    travelStyle: '',
    interest: '',
    budget: '',
    duration: 0,
    groupType: '',
  })

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
      setLoading(true);
      setError(null);

    if(
      !formData.country ||
      !formData.travelStyle ||
      !formData.interest ||
      !formData.budget ||
      !formData.groupType
    ) {
      setError("Please provide values for all fields.");
      setLoading(false);
      return;
    }

    if (formData.duration < 1 || formData.duration > 10) {
      setError("Duration must be between from 1 to 10 days.");
      setLoading(false);
      return;
    }

    const user = await getCurrentUser();
    if(!user) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-trip', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          country: formData.country,
          numberOfDays: formData.duration,
          travelStyle: formData.travelStyle,
          interests: formData.interest,
          budget: formData.budget,
          groupType: formData.groupType,
          userId: user.$id,
        }),
      })

      const result: CreateTripResponse = await response.json();

      if(result?.$id) navigate(`/trips/${result.$id}`)
      else console.error('Failed to generate trip:');

    } catch (e) {
      console.error("Error creating trip:", e);
      setError("An error occurred while creating the trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof TripFormData, value: string | number) => {
    setFormData({ ...formData, [key]: value });
  }

  const countryData = countries.map((country) => ({
    name: country.name,
    flag: country.flag,
    value: country.value,
  }))

  const mapData = [
    {
      country: formData.country,
      color: '#EA382E',
      coordinates: countries.find((c) => c.name === formData.country)?.coordinates || [],
    }
  ]

  const comboRef = useRef<ComboBoxComponent>(null);

  return (
    <main className="flex flex-col gap-10 pb-20 wrapper">
      <Header
        title="Add a New Trip"
        description="View and edit AI-Generated travel plans"
      />
      <section className="mt-2.5 wrapper-md">
        <form className="trip-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="country">
              Country
            </label>
            <ComboBoxComponent
              ref={comboRef}
              id="country"
              dataSource={countryData}
              fields={{ text: "name", value: "value" }}
              placeholder="Select a Country"
              className="combo-box"

              allowCustom={true}
              showClearButton={true}
              autofill={false}
              
              change={(e: any) => {
                if (e.value) {
                  handleChange('country', e.value);
                }
              }}
              allowFiltering
              filtering={(e) => {
                const query = e.text.toLowerCase();

                e.updateData(
                  countries
                    .filter((country) =>
                      country.name.toLowerCase().includes(query)
                    )
                    .map((country) => ({
                      name: country.name,
                      flag: country.flag,
                      value: country.value,
                    }))
                );
              }}
              itemTemplate={(data: any) => (
                <div className="flex items-center">
                  <img
                    src={data.flag}
                    width={20}
                    height={14}
                    alt={`Flag of ${data.name}`}
                  />
                  <span>{data.name}</span>
                </div>
              )}
              focus={() => {
                comboRef.current?.clear();
                handleChange("country", "");
              }}
            />
          </div>

          <div>
            <label htmlFor="duration">
              Duration
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              placeholder="Enter trip duration in days"
              className="form-input placeholder:text-gray-100"
              onChange={(e) => handleChange('duration', Number(e.target.value))}
            />
          </div>

          {selectItems.map((key) => (
            <div key={key}>
              <label htmlFor={key}>{formatKey(key)}</label>

              <ComboBoxComponent
                id="key"
                dataSource={comboBoxItems[key].map((item) => ({
                  text: item,
                  value: item,
                }))}
                fields={{ text: 'text', value: 'value' }}
                placeholder={`Select a ${formatKey(key)}`}
                change={(e: { value: string | undefined }) => {
                  if (e.value) {
                    handleChange(key, e.value);
                  }
                }}
                allowFiltering
                filtering={(e) => {
                  const query = e.text.toLowerCase();

                  e.updateData(
                    comboBoxItems[key]
                      .filter((item) =>
                        item.toLowerCase().includes(query)
                      )
                      .map((item) => ({
                        name: item,
                        value: item,
                      }))
                  );
                }}
                className="combo-box"
              />
            </div>
          ))}

          <div>
            <label htmlFor="location">Location around the world map</label>
            
            <MapsComponent>
              <LayersDirective>
                  <LayerDirective
                    shapeData={world_map}
                    dataSource={mapData}
                    shapePropertyPath="name"
                    shapeDataPath="country"
                    shapeSettings={{ colorValuePath: 'color', fill: '#E5E5E5'}}
                  />
              </LayersDirective>
            </MapsComponent>
          </div>

          <div className="bg-gray-200 h-px w-full" />

          {error && (
            <div className="error">
              <p>{error}</p> 
            </div>
          )}

          <footer className="px-6 2-full">
            <ButtonComponent type="submit"
              className="button-class h-12! w-full!"
              disabled={loading}
            >
              <img
                src={`/assets/icons/${loading ? "loader.svg" : "magic-star.svg"}`}
                alt={loading ? "Loading" : "Magic star"}
                className={cn("size-5", { "animate-spin": loading })}
              />
              <span className="p-16-semibold text-white">
                {loading ? "Generating..." : "Generate Trip"}
              </span>
            </ButtonComponent>
          </footer>
        </form>
      </section>
    </main>
  )
}

export default CreateTrip