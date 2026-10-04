import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Zap, Plane, Calendar, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import type { SavedFlightResponse, FlightPredictionRequest } from '../../types/api';

interface SavedFlightsModuleProps {
  onPredictFlight: (flightData: Partial<FlightPredictionRequest>) => void;
}

export const SavedFlightsModule: React.FC<SavedFlightsModuleProps> = ({ onPredictFlight }) => {
  const [flights, setFlights] = useState<SavedFlightResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Saved Flight Form
  const [isAdding, setIsAdding] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [carrier, setCarrier] = useState('AA');
  const [origin, setOrigin] = useState('JFK');
  const [destination, setDestination] = useState('LAX');
  const [scheduledDeparture, setScheduledDeparture] = useState('2026-10-15T14:30');

  useEffect(() => {
    fetchSavedFlights();
  }, []);

  const fetchSavedFlights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSavedFlights();
      setFlights(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load saved flights.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!flightNumber || !carrier || !origin || !destination) {
      setError('Please fill all required flight fields.');
      return;
    }

    try {
      await apiService.saveFlight({
        flight_number: flightNumber.trim().toUpperCase(),
        carrier: carrier.trim().toUpperCase(),
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        scheduled_departure: scheduledDeparture,
      });

      setIsAdding(false);
      setFlightNumber('');
      fetchSavedFlights();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not save flight.');
    }
  };

  const handleDeleteFlight = async (id: number) => {
    try {
      await apiService.deleteSavedFlight(id);
      setFlights((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError('Could not delete flight.');
    }
  };

  const handlePredictClick = (flight: SavedFlightResponse) => {
    onPredictFlight({
      flight_number: flight.flight_number,
      carrier: flight.carrier,
      origin: flight.origin,
      destination: flight.destination,
      scheduled_departure: flight.scheduled_departure || '2026-10-15T14:30:00Z',
      distance_miles: 2475,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-aviation-850 border border-aviation-700/80 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan font-mono text-xs font-bold uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Customer Saved Flights</span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-white mt-1">My Frequently Checked Flights</h2>
          <p className="text-xs text-slate-400">Save your regular routes and quickly execute delay predictions with one click.</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Cancel' : 'Save New Flight'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Saved Flight Form */}
      {isAdding && (
        <form onSubmit={handleAddFlight} className="bg-aviation-850 border-2 border-aviation-cyan/40 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <Plus className="w-4 h-4 text-aviation-cyan" />
            <span>Add Flight to Saved List</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Flight Number</label>
              <input
                type="text"
                required
                placeholder="AA-1042"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3 py-2 text-white focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Airline Carrier</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3 py-2 text-white focus:border-aviation-cyan focus:outline-none"
              >
                <option value="AA">American Airlines (AA)</option>
                <option value="DL">Delta Air Lines (DL)</option>
                <option value="UA">United Airlines (UA)</option>
                <option value="WN">Southwest Airlines (WN)</option>
                <option value="B6">JetBlue Airways (B6)</option>
                <option value="AS">Alaska Airlines (AS)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Origin Airport Code</label>
              <input
                type="text"
                required
                placeholder="JFK"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3 py-2 text-white focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Destination Airport Code</label>
              <input
                type="text"
                required
                placeholder="LAX"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3 py-2 text-white focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Scheduled Departure Time</label>
              <input
                type="datetime-local"
                value={scheduledDeparture}
                onChange={(e) => setScheduledDeparture(e.target.value)}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3 py-2 text-white focus:border-aviation-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-aviation-800 text-slate-300 rounded-xl text-xs hover:bg-aviation-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-aviation-cyan text-aviation-900 font-bold rounded-xl text-xs hover:bg-aviation-cyan/90"
            >
              Save Flight
            </button>
          </div>
        </form>
      )}

      {/* Saved Flights List Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-sm">Loading saved flights...</div>
      ) : flights.length === 0 ? (
        <div className="bg-aviation-850 border border-aviation-700/80 rounded-2xl p-12 text-center space-y-3">
          <Bookmark className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">No Saved Flights Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Save frequently checked flight numbers or routes to access instant delay predictions anytime.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center space-x-2 bg-aviation-cyan/20 border border-aviation-cyan text-aviation-cyan font-bold px-4 py-2 rounded-xl text-xs hover:bg-aviation-cyan/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Saved Flight</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flights.map((flight) => (
            <div
              key={flight.id}
              className="bg-aviation-850 border border-aviation-700/80 rounded-2xl p-5 hover:border-aviation-cyan/50 transition-all space-y-4 shadow-lg relative group"
            >
              <div className="flex items-center justify-between border-b border-aviation-700/60 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="px-2.5 py-1 rounded bg-aviation-cyan/15 text-aviation-cyan font-mono font-bold text-xs border border-aviation-cyan/30">
                    {flight.carrier}
                  </div>
                  <span className="font-mono font-bold text-white text-base">{flight.flight_number}</span>
                </div>

                <button
                  onClick={() => handleDeleteFlight(flight.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Remove saved flight"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm font-mono text-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Origin</span>
                  <div className="font-bold text-lg text-white">{flight.origin}</div>
                </div>
                <Plane className="w-5 h-5 text-aviation-sky transform rotate-90" />
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] text-slate-400 uppercase">Destination</span>
                  <div className="font-bold text-lg text-white">{flight.destination}</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {flight.scheduled_departure
                      ? new Date(flight.scheduled_departure).toLocaleDateString()
                      : 'Scheduled'}
                  </span>
                </span>

                <button
                  onClick={() => handlePredictClick(flight)}
                  className="flex items-center space-x-1.5 bg-aviation-cyan/20 border border-aviation-cyan text-aviation-cyan hover:bg-aviation-cyan/30 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Predict Delay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
