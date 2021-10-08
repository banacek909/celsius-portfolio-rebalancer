import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { GlobalStore } from "./store";
import reportWebVitals from "./reportWebVitals";

// Import Blueprint CSS
import "normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
//import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { ThemeProvider } from "styled-components";
import { GlobalStyle, theme } from "./styles";
import { BrowserRouter, Route } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";

ReactDOM.render(
  <React.StrictMode>
    <GlobalStore>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <QueryParamProvider ReactRouterRoute={Route}>
            <App />
            <GlobalStyle />
          </QueryParamProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GlobalStore>
  </React.StrictMode>,
  document.getElementById("root")
);

/*
       <QueryParamProvider ReactRouterRoute={Route}>
          <App />
          <GlobalStyle />
        </QueryParamProvider>
 
*/

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
