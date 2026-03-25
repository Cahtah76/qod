import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, MapPin, Building2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import VenueForm from './VenueForm.jsx'

export default function VenuesPage() {
  const { state } = useApp()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = state.venues.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Venues"
        subtitle={`${state.venues.length} venues`}
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Venue
          </button>
        }
      />
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search venues..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(venue => {
            const eventCount = state.events.filter(e => e.venueId === venue.id).length
            const openIssues = state.issues.filter(i => i.linkedTo?.type === 'Venue' && i.linkedTo?.id === venue.id && i.status !== 'Resolved' && i.status !== 'Closed').length
            return (
              <Link key={venue.id} to={`/venues/${venue.id}`} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{venue.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin size={10} />{venue.city}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{eventCount} events</span>
                      {openIssues > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          {openIssues} open issue{openIssues !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {venue.contacts.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">{venue.contacts[0].name} · {venue.contacts[0].role}</div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Venue" size="lg">
        <VenueForm onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  )
}
