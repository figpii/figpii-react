# React tool for FigPii
Show FigPii A/B testing variations in your React app

# Install

    npm install https://github.com/figpii/figpii-react.git

# Use
```JS
import {createFigpiiContext} from "figpii-react";
export const FigpiiContext = createFigpiiContext();
```

Create `FigpiiContext` object and import it when needed. Use `FigpiiContext.Provider` as a wrapper where you would use a React context provider: 

```JS
import {FigpiiContext} from "./FigpiiContext.js";
    
export default function MyApp() {
    return (
        <FigpiiContext.Provider>
            <Panel/>
        </FigpiiContext.Provider>
    );
}
```

To pass a variation ID chosen for one or more experiments use `FigpiiContext.Consumer`:


```JS
export default function Panel() {
    return (
        <FigpiiContext.Consumer experimentIds={["350119", "350120"]}>
            {(experiment350119variationId, experiment350120variationId) => {
                switch (experiment350119variationId) {
                    case "51104":
                        return (<p>Variation 51104</p>);
                    case "51105":
                        return (<p>Variation 51105</p>);
                    default:
                        return (<LoadingIndicator/>);
                }
            }}
        </FigpiiContext.Consumer>
    )
}
```

If a variation has not been decided yet, `undefined` will be passed instead of variation ID. Additional props supported by `FigpiiContext.Provider`:

* `checkTimeout`: How long to wait in milliseconds until we stop checking for Figpii tracking script being loaded. Default: `7500`.
* `checkInterval`: Interval in milliseconds between checks for Figpii tracking code being loaded. Default: `200`.