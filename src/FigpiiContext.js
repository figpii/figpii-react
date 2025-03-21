import React, {useContext, useEffect, useState} from "react";
import createMultiContext from "./multiContext";

const doesFigpiiExist = () => {
    return typeof window !== 'undefined' && typeof window.FIGPII !==
        'undefined';
};

const useActiveVariationState = (defaultState = {}) => {
    const [activeVariation, setActiveVariation] = useState(defaultState);
    return [activeVariation, (experimentId, variationId) => {
        setActiveVariation((prevState) => {
            prevState[experimentId] = variationId;
            return prevState;
        })
    }]
}

const Context = createMultiContext();

export function FigpiiExperimentContext({children}) {
    const [activeVariations, setActiveVariation] = useActiveVariationState();
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
                clearInterval(interval);
                clearTimeout(timeout);
            }
        }

        // Start polling every 200ms until FigPii is available
        interval = setInterval(initActiveVariations, 200);
        // Stop polling after 7500ms if FigPii never loads
        timeout = setTimeout(() => {
            clearInterval(interval);
        }, 7500);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
            window.removeEventListener('figpii::experiment.variation.decided',
                initActiveVariations);
        };
    }, []);

    return React.createElement(Context, {set: activeVariations},
        children);
}

export function useFigpiiExperimentContext(experimentId) {
    return useContext(Context.getSingleContext(experimentId));
}