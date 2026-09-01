import React, { useMemo, useState, useEffect } from 'react';
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
  arrowBackOutline,
  closeOutline,
} from 'ionicons/icons';

import { api } from '../services/api';
import TopNavbar from '../components/TopNavbar';
import './Assets.css';

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'Available' | 'Rented' | 'Maintenance' | 'Flagged';
  client: string;
  utilization: number;
  model?: string;
}

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    equipment_id: '',
    name: '',
    type: 'Excavator',
    model: '',
    site_id: 'Bangalore',
    client_name: '',
  });

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      setLoading(true);
      const fleet = await api.assets.getFleet();
      const mapped: Asset[] = fleet.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        location: item.location || 'Depot',
        status: (item.status === 'Rented'
          ? 'Rented'
          : item.status === 'Maintenance'
          ? 'Maintenance'
          : item.status === 'Flagged'
          ? 'Flagged'
          : 'Available') as any,
        client: item.client || '—',
        utilization: item.utilization_pct_7d || 0,
        model: item.model,
      }));
      setAssets(mapped);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!newAsset.equipment_id || !newAsset.type) {
      alert('Equipment ID and Type are required');
      return;
    }
    try {
      await api.assets.create({
        equipment_id: newAsset.equipment_id,
        type: newAsset.type,
        name: newAsset.name || `${newAsset.type} ${newAsset.equipment_id}`,
        model: newAsset.model,
        site_id: newAsset.site_id,
        client_name: newAsset.client_name || undefined,
      });
      setShowAddModal(false);
      setNewAsset({
        equipment_id: '',
        name: '',
        type: 'Excavator',
        model: '',
        site_id: 'Bangalore',
        client_name: '',
      });
      await loadAssets();
    } catch (err: any) {
      alert(`Error creating asset: ${err.message}`);
    }
  }

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
        asset.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  const total = assets.length;
  const available = assets.filter((asset) => asset.status === 'Available').length;
  const rented = assets.filter((asset) => asset.status === 'Rented').length;
  const maintenance = assets.filter((asset) => asset.status === 'Maintenance').length;

  return (
    <IonPage>
      <IonContent fullscreen className="assets-page">
        <div className="assets-container">

          {/* TOP NAV BAR */}
          <TopNavbar currentTitle="Assets Registry" activePath="/assets" />

          {/* HEADER */}
          <header className="assets-header">
            <div>
              <div className="assets-title-row">
                <IonIcon icon={constructOutline} />
                <h1>Assets</h1>
              </div>
              <p>Track every machine from handoff to return with live telemetry.</p>
            </div>

            <button className="add-asset-button" onClick={() => setShowAddModal(true)}>
              <IonIcon icon={addOutline} />
              Add Asset
            </button>
          </header>

          {/* SUMMARY */}
          <section className="asset-summary">
            <div className="asset-summary-card">
              <span>Total Assets</span>
              <strong>{total}</strong>
              <small>Registered in fleet</small>
            </div>

            <div className="asset-summary-card">
              <span>Available</span>
              <strong>{available}</strong>
              <small>Ready for deployment</small>
            </div>

            <div className="asset-summary-card">
              <span>Rented</span>
              <strong>{rented}</strong>
              <small>Currently with clients</small>
            </div>

            <div className="asset-summary-card">
              <span>Maintenance</span>
              <strong>{maintenance}</strong>
              <small>Temporarily unavailable</small>
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
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="asset-filter">
              <IonIcon icon={filterOutline} />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Flagged">Flagged</option>
              </select>
            </div>
          </section>

          {/* ASSET REGISTRY TABLE */}
          <section className="asset-table-card">
            <div className="asset-table-header">
              <div>
                <h2>Asset Registry</h2>
                <p>Every asset has a unique identity, real-time status and telemetry history.</p>
              </div>
              <span>{filteredAssets.length} assets</span>
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
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <div className="asset-name-cell">
                          <div className="asset-machine-icon">🚜</div>
                          <div>
                            <strong>{asset.name}</strong>
                            <small>{asset.id} · {asset.model || 'CAT Machine'}</small>
                          </div>
                        </div>
                      </td>

                      <td>{asset.type}</td>

                      <td>
                        <div className="asset-location">
                          <IonIcon icon={locationOutline} />
                          {asset.location}
                        </div>
                      </td>

                      <td>
                        <span className={`asset-status ${asset.status.toLowerCase()}`}>
                          <span>●</span>
                          {asset.status}
                        </span>
                      </td>

                      <td>{asset.client}</td>

                      <td>
                        <div className="utilization-cell">
                          <div className="utilization-bar">
                            <span style={{ width: `${Math.min(asset.utilization, 100)}%` }} />
                          </div>
                          <small>{asset.utilization}%</small>
                        </div>
                      </td>

                      <td>
                        <button
                          className="asset-details-button"
                          aria-label={`View ${asset.id}`}
                          onClick={() => {
                            window.location.href = `/usage?id=${asset.id}`;
                          }}
                        >
                          <IonIcon icon={chevronForwardOutline} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading fleet data from backend...
                </div>
              )}

              {filteredAssets.length === 0 && !loading && (
                <div className="empty-assets">
                  No assets match your search or filter.
                </div>
              )}
            </div>
          </section>

          {/* ADD ASSET MODAL */}
          {showAddModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <div
                style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '520px',
                  padding: '24px',
                  color: '#fff',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Register New Fleet Asset</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '1.5rem' }}
                  >
                    <IonIcon icon={closeOutline} />
                  </button>
                </div>

                <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>Equipment ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. CAT-330-05 or EQX1008"
                      value={newAsset.equipment_id}
                      onChange={(e) => setNewAsset({ ...newAsset, equipment_id: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>Equipment Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Excavator 330 GC"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>Machine Type *</label>
                      <select
                        value={newAsset.type}
                        onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      >
                        <option value="Excavator">Excavator</option>
                        <option value="Bulldozer">Bulldozer</option>
                        <option value="Crane">Crane</option>
                        <option value="Grader">Grader</option>
                        <option value="Loader">Loader</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>Model</label>
                      <input
                        type="text"
                        placeholder="e.g. 330 GC"
                        value={newAsset.model}
                        onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '6px' }}>Location / Site ID</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore or S005"
                      value={newAsset.site_id}
                      onChange={(e) => setNewAsset({ ...newAsset, site_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: '1px solid #3f3f46',
                        color: '#a1a1aa',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        background: '#FFCD11',
                        border: 'none',
                        color: '#000',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Save Asset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Assets;