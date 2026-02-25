// Physics Controls Panel — extracted from index.html inline script
// Dynamically builds the audio-parameter sliders in the sidebar.
// `engine` is passed in (the AudioEngine instance) to avoid depending on window globals.

export function generatePhysicsControls(engine) {
    console.log('generatePhysicsControls called');

    const container = document.getElementById('physicsControls');
    console.log('Container found:', !!container);
    console.log('AudioEngine found:', !!engine);
    console.log('AudioEngine type:', typeof engine);

    if (!container) {
        console.error('Physics controls container not found');
        return;
    }

    if (!engine) {
        console.error('AudioEngine not available');
        return;
    }

    // Clear existing controls
    container.innerHTML = '';

    console.log('Generating physics controls...');

    const paramDefs = {
        sampleBlend:    { min: 0,     max: 1,   step: 0.01,  label: 'Sample Blend' },
        volume:         { min: 0,     max: 1,   step: 0.01,  label: 'Volume' },
        brightness:     { min: 0,     max: 1,   step: 0.01,  label: 'Brightness' },
        warmth:         { min: 0,     max: 1,   step: 0.01,  label: 'Warmth' },
        attack:         { min: 0.001, max: 0.1, step: 0.001, label: 'Attack' },
        release:        { min: 0.5,   max: 5,   step: 0.1,   label: 'Release' },
        harmonics:      { min: 0,     max: 1,   step: 0.01,  label: 'Harmonics' },
        detune:         { min: 0,     max: 1,   step: 0.01,  label: 'Detune' },
        chorus:         { min: 0,     max: 1,   step: 0.01,  label: 'Chorus' },
        roomSize:       { min: 0,     max: 1,   step: 0.01,  label: 'Room Size' },
        damping:        { min: 0,     max: 1,   step: 0.01,  label: 'Damping' },
        lidPosition:    { min: 0,     max: 1,   step: 0.01,  label: 'Lid Position' },
        pedalResonance: { min: 0,     max: 1,   step: 0.01,  label: 'Pedal Resonance' }
    };

    let controlsCreated = 0;

    Object.entries(paramDefs).forEach(([param, def]) => {
        console.log(`Creating control for ${param}`);

        const group = document.createElement('div');
        group.className = 'param-group';

        const label = document.createElement('label');
        label.className = 'param-label';
        label.textContent = def.label;

        const control = document.createElement('div');
        control.className = 'param-control';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'param-slider';
        slider.min = def.min;
        slider.max = def.max;
        slider.step = def.step;

        // Get current parameter value
        const currentValue = engine.getParam ? engine.getParam(param) : 0.5;
        slider.value = currentValue;
        console.log(`${param} current value: ${currentValue}`);

        const value = document.createElement('span');
        value.className = 'param-value';
        value.textContent = parseFloat(slider.value).toFixed(2);

        let debounceTimer = null;
        slider.addEventListener('input', (e) => {
            const newValue = parseFloat(e.target.value);
            value.textContent = newValue.toFixed(2);
            console.log(`${param} changed to: ${newValue}`);
            if (engine.setParam) {
                if (param === 'roomSize') {
                    // Debounce: impulse buffer generation is expensive; wait until dragging stops
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => engine.setParam(param, newValue), 150);
                } else {
                    engine.setParam(param, newValue);
                }
            }
        });

        control.appendChild(slider);
        control.appendChild(value);
        group.appendChild(label);
        group.appendChild(control);
        container.appendChild(group);

        controlsCreated++;
    });

    console.log(`Created ${controlsCreated} physics controls`);
}
