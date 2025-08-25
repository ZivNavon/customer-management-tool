'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  MagnifyingGlassPlusIcon, 
  MagnifyingGlassMinusIcon, 
  ArrowsRightLeftIcon,
  ArrowsUpDownIcon,
  ArrowUturnLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface LogoEditorProps {
  imageUrl: string;
  onSave: (editedImageData: LogoEditData) => void;
  onCancel: () => void;
  initialData?: LogoEditData;
}

export interface LogoEditData {
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
}

export function LogoEditor({ imageUrl, onSave, onCancel, initialData }: LogoEditorProps) {
  const [editData, setEditData] = useState<LogoEditData>(
    initialData || {
      scale: 1,
      positionX: 0,
      positionY: 0,
      rotation: 0
    }
  );
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageLoaded) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, [imageLoaded]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = (e.clientX - dragStart.x) * 0.5;
    const deltaY = (e.clientY - dragStart.y) * 0.5;
    
    setEditData(prev => ({
      ...prev,
      positionX: Math.max(-100, Math.min(100, prev.positionX + deltaX)),
      positionY: Math.max(-100, Math.min(100, prev.positionY + deltaY))
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => {
    setEditData(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale + 0.1)
    }));
  };

  const handleZoomOut = () => {
    setEditData(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale - 0.1)
    }));
  };

  const handleRotate = () => {
    setEditData(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const handleReset = () => {
    setEditData({
      scale: 1,
      positionX: 0,
      positionY: 0,
      rotation: 0
    });
  };

  const handleSliderChange = (property: keyof LogoEditData, value: number) => {
    setEditData(prev => ({
      ...prev,
      [property]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            🎨 Logo Editor
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onSave(editData)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview (Drag to move)
              </h4>
              <div 
                ref={containerRef}
                className="relative w-full h-64 bg-white dark:bg-gray-600 rounded border-2 border-dashed border-gray-300 dark:border-gray-500 overflow-hidden cursor-move"
                onMouseDown={handleMouseDown}
              >
                {imageUrl && (
                  <div
                    style={{
                      transform: `translate(${editData.positionX}px, ${editData.positionY}px) scale(${editData.scale}) rotate(${editData.rotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease',
                      transformOrigin: 'center',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-50px',
                      marginLeft: '-50px'
                    }}
                  >
                    <Image
                      src={imageUrl}
                      alt="Logo Preview"
                      width={100}
                      height={100}
                      className="object-contain"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageLoaded(false)}
                    />
                  </div>
                )}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading image...
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleZoomIn}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Zoom In"
              >
                <MagnifyingGlassPlusIcon className="h-4 w-4 mr-1" />
                Zoom In
              </button>
              <button
                onClick={handleZoomOut}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Zoom Out"
              >
                <MagnifyingGlassMinusIcon className="h-4 w-4 mr-1" />
                Zoom Out
              </button>
              <button
                onClick={handleRotate}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                title="Rotate 90°"
              >
                <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                Rotate
              </button>
              <button
                onClick={handleReset}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                title="Reset All"
              >
                <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fine Controls
            </h4>

            {/* Scale Control */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                🔍 Scale: {editData.scale.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={editData.scale}
                onChange={(e) => handleSliderChange('scale', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1x</span>
                <span>3x</span>
              </div>
            </div>

            {/* Horizontal Position */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                ↔️ Horizontal: {editData.positionX.toFixed(0)}px
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={editData.positionX}
                onChange={(e) => handleSliderChange('positionX', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Left</span>
                <span>Right</span>
              </div>
            </div>

            {/* Vertical Position */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                ↕️ Vertical: {editData.positionY.toFixed(0)}px
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={editData.positionY}
                onChange={(e) => handleSliderChange('positionY', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Up</span>
                <span>Down</span>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                🔄 Rotation: {editData.rotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={editData.rotation}
                onChange={(e) => handleSliderChange('rotation', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0°</span>
                <span>360°</span>
              </div>
            </div>

            {/* Current Values Display */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mt-4">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Settings:
              </h5>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Scale: {editData.scale.toFixed(1)}x</div>
                <div>X: {editData.positionX}px</div>
                <div>Y: {editData.positionY}px</div>
                <div>Rotation: {editData.rotation}°</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <h5 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                💡 Tips:
              </h5>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Drag the image to move it</li>
                <li>• Use sliders for precise control</li>
                <li>• Click Rotate for 90° turns</li>
                <li>• Reset to start over</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
