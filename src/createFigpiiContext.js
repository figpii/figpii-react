import React, {useContext, useEffect, useState} from "react";
import createMultiContext from "./multiContext";

const doesFigpiiExist = () => {
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
        Provider: ({experimentIds, children}) => {
            const defaultVariationState = {};
            if (experimentIds) {
                experimentIds.forEach((id) => defaultVariationState[id] = "0");
            }
            const [activeVariations, setActiveVariation] = useActiveVariationState(defaultVariationState);
            useEffect(() => {
                let interval;
                let timeout;

                const handleDecidedVariation = (variationDecidedEvent) =>
                    setActiveVariation(variationDecidedEvent.toolId, variationDecidedEvent.variationId);

                const initActiveVariations = () => {
                    if (doesFigpiiExist()) {
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
                interval = setInterval(initActiveVariations, 200);
                // Stop polling after 7500ms if FigPii never loads
                timeout = setTimeout(() => {
                    clearInterval(interval);
                }, 7500);
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