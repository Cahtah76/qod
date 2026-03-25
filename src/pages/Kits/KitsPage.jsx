import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, Search, Package, MapPin, Edit, Trash2, Clock } from 'lucide-react'
import { useApp, getEventStatus } from '../../context/AppContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import KitForm from './KitForm.jsx'

export default function KitsPage() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editKit, setEditKit] = useState(null)
  const [expandedKit, setExpandedKit] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = state.kits.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.currentLocation?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Kits"
        subtitle={`${state.kits.length} kits`}
        actions={
          <button className="btn-primary" onClick={() => { setEditKit(null); setShowModal(true) }}>
            <Plus size={14} /> Add Kit
          </button>
        }
      />
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search kits..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Kit</th>
                <th className="table-header">Current Location</th>
                <th className="table-header">Assigned Events</th>
                <th className="table-header">Inventory</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(kit => {
                const assignedEvents = state.events.filter(e => e.kitId === kit.id && getEventStatus(e) !== 'Complete')
                const isExpanded = expandedKit === kit.id
                return (
                  <React.Fragment key={kit.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                            <Package size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{kit.name}</div>
                            {kit.description && <div className="text-xs text-gray-500">{kit.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin size={12} className="text-gray-400" />
                          {kit.currentLocation || '—'}
                        </div>
                      </td>
                      <td className="table-cell">
                        {assignedEvents.length === 0 ? (
                          <span className="text-xs text-gray-400">Not assigned</span>
                        ) : (
                          <div className="space-y-0.5">
                            {assignedEvents.map(e => (
                              <Link key={e.id} to={`/events/${e.id}`} className="block text-xs text-blue-700 hover:underline">
                                {e.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        {kit.inventory.length > 0 ? (
                          <button
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => setExpandedKit(isExpanded ? null : kit.id)}
                          >
                            {kit.inventory.length} items {isExpanded ? '▲' : '▼'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No inventory</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditKit(kit); setShowModal(true) }} className="text-gray-400 hover:text-blue-600">
                            <Edit size={13} />
                          </button>
                          <button onClick={() => setDeleteId(kit.id)} className="text-gray-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-4 pb-3 bg-gray-50">
                          <div className="ml-11">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Inventory</div>
                            <div className="grid grid-cols-3 gap-2">
                              {kit.inventory.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded px-3 py-1.5">
                                  <span className="text-gray-700">{item.item}</span>
                                  <span className="font-semibold text-gray-600 ml-2">×{item.qty}</span>
                                </div>
                              ))}
                            </div>

                            {kit.locationHistory.length > 0 && (
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Location History</div>
                                <div className="space-y-1">
                                  {kit.locationHistory.map((h, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs text-gray-600">
                                      <Clock size={10} className="text-gray-400 flex-shrink-0" />
                                      <span className="font-medium">{h.location}</span>
                                      <span className="text-gray-400">{format(new Date(h.date), 'MMM d, yyyy')}</span>
                                      {h.note && <span className="text-gray-500 italic">— {h.note}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditKit(null) }} title={editKit ? 'Edit Kit' : 'Add Kit'} size="lg">
        <KitForm kit={editKit} onClose={() => { setShowModal(false); setEditKit(null) }} />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Kit" size="sm">
        <div>
          <p className="text-sm text-gray-700 mb-4">Delete this kit? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => { dispatch({ type: 'DELETE_KIT', payload: deleteId }); setDeleteId(null) }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
