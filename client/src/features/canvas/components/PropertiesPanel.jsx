import React from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { getBoardSocket } from '@/sockets/socket';
import { useParams } from 'react-router-dom';
import { Square, Disc, MoveUp, MoveDown } from 'lucide-react';

const COLORS = [
  'transparent', '#F4F4FC', '#1A1A24', '#6E56CF', '#38BDF8', '#34D399', '#FBBF24', '#FB7185'
];

export default function PropertiesPanel() {
  const { boardId } = useParams();
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const elements = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  
  if (selectedIds.length === 0) return null;

  // Operating on the first selected element to populate the form values
  const el = elements.find((e) => e.id === selectedIds[0]);
  if (!el) return null;
  
  const properties = el.properties || {};

  const handleUpdate = (key, value) => {
    const socket = getBoardSocket();
    selectedIds.forEach((id) => {
      const targetEl = elements.find(e => e.id === id);
      if (!targetEl) return;
      
      const newProps = { ...targetEl.properties, [key]: value };
      
      pushHistory({
        type: 'UPDATE',
        elementId: id,
        previousData: { properties: targetEl.properties || {} },
        nextData: { properties: newProps }
      });
      
      updateElement(id, { properties: newProps });
      
      if (socket) {
        socket.emit('element:updated', {
          boardId,
          elementId: id,
          updates: { properties: newProps },
          version: targetEl.version
        });
      }
    });
  };

  const handleLayerUpdate = (direction) => {
    const socket = getBoardSocket();
    selectedIds.forEach((id) => {
      const targetEl = elements.find(e => e.id === id);
      if (!targetEl) return;
      
      const currentZ = targetEl.properties?.z_index || 0;
      const newZ = direction === 'up' ? currentZ + 1 : currentZ - 1;
      
      const newProps = { ...targetEl.properties, z_index: newZ };

      pushHistory({
        type: 'UPDATE',
        elementId: id,
        previousData: { properties: targetEl.properties || {} },
        nextData: { properties: newProps }
      });

      updateElement(id, { properties: newProps });
      
      if (socket) {
        socket.emit('element:updated', {
          boardId,
          elementId: id,
          updates: { properties: newProps },
          version: targetEl.version
        });
      }
    });
  };

  return (
    <div className="absolute right-4 top-8 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-sf-lg shadow-sf-floating p-4 z-40 flex flex-col gap-4 text-slate-50">
      <h3 className="text-sf-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Properties</h3>
      
      {/* Background Color */}
      <div className="flex flex-col gap-2">
        <span className="text-sf-xs text-slate-400">Background</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={`bg-${c}`}
              className={`w-6 h-6 rounded-full border ${c === 'transparent' ? 'border-dashed border-slate-500' : 'border-slate-700'} ${properties.fillColor === c || (c === el.color && !properties.fillColor) ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-900' : ''}`}
              style={{ backgroundColor: c !== 'transparent' ? c : undefined }}
              onClick={() => handleUpdate('fillColor', c)}
            />
          ))}
        </div>
      </div>
      
      {/* Stroke Color */}
      <div className="flex flex-col gap-2">
        <span className="text-sf-xs text-slate-400">Stroke</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={`stroke-${c}`}
              className={`w-6 h-6 rounded-full border ${c === 'transparent' ? 'border-dashed border-slate-500' : 'border-slate-700'} ${properties.strokeColor === c ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-900' : ''}`}
              style={{ backgroundColor: c !== 'transparent' ? c : undefined }}
              onClick={() => handleUpdate('strokeColor', c)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Stroke Width */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-sf-xs text-slate-400">Width</span>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-sf-md border border-slate-700">
            {[2, 4, 8].map(w => (
              <button
                key={`w-${w}`}
                className={`flex-1 flex justify-center items-center py-1 rounded-sm ${properties.strokeWidth === w || (!properties.strokeWidth && w === 2) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => handleUpdate('strokeWidth', w)}
              >
                <div className="bg-current rounded-full w-4" style={{ height: `${w}px` }} />
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Style */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-sf-xs text-slate-400">Style</span>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-sf-md border border-slate-700">
            <button
              className={`flex-1 flex justify-center items-center py-1 rounded-sm ${properties.strokeStyle === 'solid' || !properties.strokeStyle ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => handleUpdate('strokeStyle', 'solid')}
            >
              <svg width="24" height="6" viewBox="0 0 24 6">
                <line x1="0" y1="3" x2="24" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className={`flex-1 flex justify-center items-center py-1 rounded-sm ${properties.strokeStyle === 'dashed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => handleUpdate('strokeStyle', 'dashed')}
            >
              <svg width="24" height="6" viewBox="0 0 24 6">
                <line x1="0" y1="3" x2="24" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="6,4" />
              </svg>
            </button>
            <button
              className={`flex-1 flex justify-center items-center py-1 rounded-sm ${properties.strokeStyle === 'dotted' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => handleUpdate('strokeStyle', 'dotted')}
            >
              <svg width="24" height="6" viewBox="0 0 24 6">
                <line x1="0" y1="3" x2="24" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1,5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Edges */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-sf-xs text-slate-400">Edges</span>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-sf-md border border-slate-700">
            <button
              className={`flex-1 flex justify-center items-center py-1 rounded-sm ${properties.edges !== 'round' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => handleUpdate('edges', 'sharp')}
            >
              <Square size={14} />
            </button>
            <button
              className={`flex-1 flex justify-center items-center py-1 rounded-sm ${properties.edges === 'round' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => handleUpdate('edges', 'round')}
            >
              <Disc size={14} />
            </button>
          </div>
        </div>
        
        {/* Opacity */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-sf-xs text-slate-400">Opacity</span>
          <input 
            type="range" 
            min="10" 
            max="100" 
            step="10" 
            value={(properties.opacity || 1) * 100} 
            onChange={(e) => handleUpdate('opacity', Number(e.target.value) / 100)}
            className="w-full mt-2 accent-primary-500"
          />
        </div>
      </div>

      {/* Layers */}
      <div className="flex flex-col gap-2">
        <span className="text-sf-xs text-slate-400">Layers</span>
        <div className="flex gap-2">
          <button 
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-sf-md py-1.5 text-sf-xs transition-colors"
            onClick={() => handleLayerUpdate('up')}
          >
            <MoveUp size={14} /> Forward
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-sf-md py-1.5 text-sf-xs transition-colors"
            onClick={() => handleLayerUpdate('down')}
          >
            <MoveDown size={14} /> Backward
          </button>
        </div>
      </div>
      
    </div>
  );
}
