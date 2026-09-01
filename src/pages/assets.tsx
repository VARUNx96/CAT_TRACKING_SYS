import React, { useMemo, useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';

import {
  addOutline,
  constructOutline,
  locationOutline,
  searchOutline,
  filterOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

import './Assets.css';

interface Asset {
    id: string;
    name: string;
    type: string;
    location: string;
  
    status: 'Available' | 'Rented' | 'Maintenance';
  
    client: string;
    utilization: number;
  
    // Asset Identity
    serialNumber?: string;
    model?: string;
    year?: number;
  
    // Acquisition
    purchaseDate?: string;
  
    // Maintenance
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
  
    // Rental
    currentRentalId?: string;
    rentalStartDate?: string;
    expectedReturnDate?: string;
  
    // Usage
    totalRentalDays?: number;
    totalOperatingHours?: number;
  
    // Record Metadata
    createdAt?: string;
    updatedAt?: string;
  }

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        asset.id.toLowerCase().includes(searchText) ||
        asset.name.toLowerCase().includes(searchText) ||
        asset.location.toLowerCase().includes(searchText) ||
        asset.client.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === 'All' ||
        asset.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  const total = assets.length;

  const available = assets.filter(
    (asset) => asset.status === 'Available'
  ).length;

  const rented = assets.filter(
    (asset) => asset.status === 'Rented'
  ).length;

  const maintenance = assets.filter(
    (asset) => asset.status === 'Maintenance'
  ).length;

  return (
    <IonPage>
      <IonContent fullscreen className="assets-page">

        <div className="assets-container">

          {/* HEADER */}

          <header className="assets-header">

            <div>
              <div className="assets-title-row">

                <IonIcon icon={constructOutline} />

                <h1>Assets</h1>

              </div>

              <p>
                Track every machine from handoff to return.
              </p>
            </div>

            <button className="add-asset-button">

              <IonIcon icon={addOutline} />

              Add Asset

            </button>

          </header>


          {/* SUMMARY */}

          <section className="asset-summary">

            <div className="asset-summary-card">

              <span>Total Assets</span>

              <strong>{total}</strong>

              <small>
                Registered in fleet
              </small>

            </div>


            <div className="asset-summary-card">

              <span>Available</span>

              <strong>{available}</strong>

              <small>
                Ready for deployment
              </small>

            </div>


            <div className="asset-summary-card">

              <span>Rented</span>

              <strong>{rented}</strong>

              <small>
                Currently with clients
              </small>

            </div>


            <div className="asset-summary-card">

              <span>Maintenance</span>

              <strong>{maintenance}</strong>

              <small>
                Temporarily unavailable
              </small>

            </div>

          </section>


          {/* SEARCH + FILTER */}

          <section className="asset-toolbar">

            <div className="asset-search">

              <IonIcon icon={searchOutline} />

              <input
                type="text"
                placeholder="Search asset ID, machine, location or client..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>


            <div className="asset-filter">

              <IonIcon icon={filterOutline} />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >

                <option value="All">
                  All Status
                </option>

                <option value="Available">
                  Available
                </option>

                <option value="Rented">
                  Rented
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

              </select>

            </div>

          </section>


          {/* ASSET REGISTRY */}

          <section className="asset-table-card">

            <div className="asset-table-header">

              <div>

                <h2>
                  Asset Registry
                </h2>

                <p>
                  Every asset has a unique identity and lifecycle.
                </p>

              </div>

              <span>
                {filteredAssets.length} assets
              </span>

            </div>


            <div className="asset-table-wrap">

              <table className="asset-table">

                <thead>

                  <tr>

                    <th>Asset</th>

                    <th>Type</th>

                    <th>Location</th>

                    <th>Status</th>

                    <th>Client</th>

                    <th>Utilization</th>

                    <th></th>

                  </tr>

                </thead>


                <tbody>

                  {filteredAssets.map((asset) => (

                    <tr key={asset.id}>

                      <td>

                        <div className="asset-name-cell">

                          <div className="asset-machine-icon">
                            🚜
                          </div>

                          <div>

                            <strong>
                              {asset.name}
                            </strong>

                            <small>
                              {asset.id}
                            </small>

                          </div>

                        </div>

                      </td>


                      <td>
                        {asset.type}
                      </td>


                      <td>

                        <div className="asset-location">

                          <IonIcon
                            icon={locationOutline}
                          />

                          {asset.location}

                        </div>

                      </td>


                      <td>

                        <span
                          className={`asset-status ${asset.status.toLowerCase()}`}
                        >

                          <span>
                            ●
                          </span>

                          {asset.status}

                        </span>

                      </td>


                      <td>
                        {asset.client}
                      </td>


                      <td>

                        <div className="utilization-cell">

                          <div className="utilization-bar">

                            <span
                              style={{
                                width: `${asset.utilization}%`,
                              }}
                            />

                          </div>

                          <small>
                            {asset.utilization}%
                          </small>

                        </div>

                      </td>


                      <td>

                        <button
                          className="asset-details-button"
                          aria-label={`View ${asset.id}`}
                        >

                          <IonIcon
                            icon={chevronForwardOutline}
                          />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>


              {filteredAssets.length === 0 && (

                <div className="empty-assets">

                  No assets match your search or filter.

                </div>

              )}

            </div>

          </section>

        </div>

      </IonContent>

    </IonPage>
  );
};

export default Assets;