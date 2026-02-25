import React, { useState } from 'react';
import { Bounce } from '@appletosolutions/reactbits';
import Balatro from './Balatro.jsx';
import './App.css';

const defaultConfig = {
  isRotate: false,
  mouseInteraction: true,
  spinRotation: -2.0,
  spinSpeed: 7.0,
  offset: [0.0, 0.0],
  color1: '#DE443B',
  color2: '#006BB4',
  color3: '#162325',
  contrast: 3.5,
  lighting: 0.4,
  spinAmount: 0.25,
  pixelFilter: 745.0,
  spinEase: 1.0
};

function LabelRow({ label, children, hint }) {
  return (
    <div className="control-row">
      <div className="control-label">
        <span>{label}</span>
        {hint && <span className="control-hint">{hint}</span>}
      </div>
      <div className="control-field">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'toggle-on' : 'toggle-off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
      <span className="toggle-text">{children}</span>
    </button>
  );
}

function PresetButtons({ onPreset }) {
  return (
    <div className="preset-buttons">
      <button
        type="button"
        className="preset-btn"
        onClick={() =>
          onPreset({
            ...defaultConfig,
            isRotate: false,
            spinSpeed: 4.0,
            contrast: 2.8,
            lighting: 0.3,
            spinAmount: 0.18
          })
        }
      >
        柔和待机
      </button>
      <button
        type="button"
        className="preset-btn"
        onClick={() =>
          onPreset({
            ...defaultConfig,
            isRotate: true,
            spinSpeed: 9.5,
            contrast: 4.0,
            lighting: 0.55,
            spinAmount: 0.4
          })
        }
      >
        高能响应
      </button>
      <button
        type="button"
        className="preset-btn"
        onClick={() =>
          onPreset({
            ...defaultConfig,
            isRotate: true,
            spinSpeed: 6.5,
            contrast: 3.0,
            lighting: 0.45,
            spinAmount: 0.3,
            color1: '#22c55e',
            color2: '#06b6d4',
            color3: '#0f172a'
          })
        }
      >
        赛博绿
      </button>
    </div>
  );
}

function FloatingControls({ config, onUpdate, onPreset }) {
  const [open, setOpen] = useState(false);

  const update = (key) => (value) => {
    onUpdate(key, value);
  };

  return (
    <>
      <button
        type="button"
        className="floating-ball"
        aria-label="打开渲染控制"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="floating-ball-inner">
          <span className="floating-ball-dot" />
          <span className="floating-ball-dot" />
          <span className="floating-ball-dot" />
        </span>
        <span className="floating-ball-text">调节</span>
      </button>

      {open && (
        <div className="floating-panel">
          <div className="floating-panel-header">
            <div className="floating-panel-title">
              <span>渲染控制</span>
              <span className="floating-panel-subtitle">Balatro · 背景配置</span>
            </div>
            <button
              type="button"
              className="floating-panel-close"
              aria-label="关闭控制面板"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <PresetButtons onPreset={onPreset} />

          <div className="controls-grid">
            <LabelRow label="旋转速度" hint={config.spinSpeed.toFixed(1)}>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={config.spinSpeed}
                onChange={(e) => update('spinSpeed')(parseFloat(e.target.value))}
              />
            </LabelRow>

            <LabelRow label="对比度" hint={config.contrast.toFixed(1)}>
              <input
                type="range"
                min="1.5"
                max="5"
                step="0.1"
                value={config.contrast}
                onChange={(e) => update('contrast')(parseFloat(e.target.value))}
              />
            </LabelRow>

            <LabelRow label="光照强度" hint={config.lighting.toFixed(2)}>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.02"
                value={config.lighting}
                onChange={(e) => update('lighting')(parseFloat(e.target.value))}
              />
            </LabelRow>

            <LabelRow label="旋涡密度" hint={config.spinAmount.toFixed(2)}>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.02"
                value={config.spinAmount}
                onChange={(e) => update('spinAmount')(parseFloat(e.target.value))}
              />
            </LabelRow>

            <LabelRow label="像素颗粒" hint={config.pixelFilter.toFixed(0)}>
              <input
                type="range"
                min="300"
                max="1100"
                step="20"
                value={config.pixelFilter}
                onChange={(e) => update('pixelFilter')(parseFloat(e.target.value))}
              />
            </LabelRow>

            <LabelRow label="过渡平滑" hint={config.spinEase.toFixed(2)}>
              <input
                type="range"
                min="0.4"
                max="1.5"
                step="0.05"
                value={config.spinEase}
                onChange={(e) => update('spinEase')(parseFloat(e.target.value))}
              />
            </LabelRow>

            <LabelRow label="主色调">
              <div className="color-row">
                <input
                  type="color"
                  value={config.color1}
                  onChange={(e) => update('color1')(e.target.value)}
                />
                <input
                  type="color"
                  value={config.color2}
                  onChange={(e) => update('color2')(e.target.value)}
                />
                <input
                  type="color"
                  value={config.color3}
                  onChange={(e) => update('color3')(e.target.value)}
                />
              </div>
            </LabelRow>

            <LabelRow label="交互">
              <div className="toggle-row">
                <Toggle checked={config.isRotate} onChange={(v) => update('isRotate')(v)}>
                  自动旋转
                </Toggle>
                <Toggle
                  checked={config.mouseInteraction}
                  onChange={(v) => update('mouseInteraction')(v)}
                >
                  鼠标偏移
                </Toggle>
              </div>
            </LabelRow>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [config, setConfig] = useState(defaultConfig);

  const handleUpdate = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreset = (preset) => {
    setConfig(preset);
  };

  return (
    <div className="app-root">
      <div className="balatro-background">
        <Balatro {...config} />
      </div>

      <div className="hero">
        <Bounce>
          <h1 className="hero-title">Example-Core</h1>
        </Bounce>
        <p className="hero-subtitle">基于 AGT 开发的 React 项目</p>
        <p className="hero-caption">XRK-AGT · sign.json 自动扫描 · 前端反向代理示例</p>

        <div className="hero-status">
          <div className="hero-status-pill fx-border fx-border-green">
            <span className="hero-status-dot hero-status-dot-ok" />
            <span className="hero-status-text">
              示例路由检查正常：
              <code>/api/example/hello</code>
            </span>
          </div>
        </div>
      </div>

      <FloatingControls config={config} onUpdate={handleUpdate} onPreset={handlePreset} />
    </div>
  );
}

