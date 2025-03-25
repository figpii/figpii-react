import React, {useEffect, useState} from "react";
import createMultiContext from "./multiContext";

const doesFigpiiTrackingCodeExist = () => {
    return typeof window !== 'undefined' && typeof window.FIGPII !==
        'undefined';
};

const useActiveVariationState = (defaultState = {}) => {
    const [activeVariation, setActiveVariation] = useState(defaultState);
    return [activeVariation, (experimentId, variationId) => {
        setActiveVariation((prevState) => Object.assign({}, prevState, {[experimentId]: variationId}))
    }]
}

export default function createFigpiiContext() {
    const Context = createMultiContext();

    return {
        Provider: ({checkInterval, checkTimeout, children}) => {
            const _checkInterval = checkInterval ?? 200;
            const _checkTimeout = checkTimeout ?? 7500;
            const defaultVariationState = {};
            const [activeVariations, setActiveVariation] = useActiveVariationState(defaultVariationState);
            useEffect(() => {
                let interval;
                let timeout;

                const handleDecidedVariation = (variationDecidedEvent) =>
                    setActiveVariation(variationDecidedEvent.toolId, variationDecidedEvent.variationId);

                const initActiveVariations = () => {
                    if (doesFigpiiTrackingCodeExist()) {
                        const activeVariations =
                            window.FIGPII.experimentManager?.getActiveVariations();
                        if (activeVariations) {
                            for (const experimentId in activeVariations) {
                                setActiveVariation(experimentId, activeVariations[experimentId]);
                            }
                        }
                        window.addEventListener('figpii::experiment.variation.decided',
                            handleDecidedVariation);
                        window.clearInterval(interval);
                        window.clearTimeout(timeout);
                    }
                }

                // Start polling every 200ms until FigPii is available
                interval = setInterval(initActiveVariations, _checkInterval);
                // Stop polling after 7500ms if FigPii never loads
                timeout = setTimeout(() => {
                    clearInterval(interval);
                }, _checkTimeout);
                return () => {
                    window.clearInterval(interval);
                    window.clearTimeout(timeout);
                    window.removeEventListener('figpii::experiment.variation.decided',
                        handleDecidedVariation);
                };
            }, []);
            return React.createElement(Context, {set: activeVariations},
                children);
        },
        Consumer: ({experimentIds, children}) => React.createElement(Context, {get: experimentIds},
            children),
        getSingleExperimentContext: (experimentId) => Context.getSingleContext(experimentId)
    }
}