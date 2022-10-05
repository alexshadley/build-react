import React from "react";
import "./style.css";

type FunctionComponent = (props: { [key: string]: any }) => SpiceElement;

type SpiceElement =
  | {
      type: string | FunctionComponent;
      props: { [key: string]: any } & { children: SpiceElement[] };
    }
  | string
  | number;

const createElement = (
  type: string,
  props: { [key: string]: any },
  ...children: SpiceElement[]
): SpiceElement => {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
};

type UseStateHook = {
  currentValue: any;
};

// hook state
const hooksByKey: { [key: string]: UseStateHook[] } = {};
let currentComponentKey: null | string = null;
let currentHookIndex: number = 0;

// render state
let shouldRender: boolean = true;
let renderRoot: HTMLElement | null = null;
let elementRoot: SpiceElement | null = null;

const render = (element: SpiceElement, container: HTMLElement) => {
  elementRoot = element;
  renderRoot = container;
};

const renderInner = (element: SpiceElement, container: HTMLElement) => {
  if (typeof element !== "object") {
    // text node
    const textNode = document.createTextNode(element.toString());
    container.appendChild(textNode);
  } else {
    if (typeof element.type === "function") {
      // before running our function component, reset state for the new component
      currentComponentKey = element.props.key;
      currentHookIndex = 0;

      // run function component and render results
      const outputElem = element.type(element.props);
      renderInner(outputElem, container);
    } else {
      // make our new element
      const domElem = document.createElement(element.type);

      // add props
      Object.entries(element.props).map(([key, value]) => {
        if (key !== "children") {
          domElem[key.toLowerCase()] = value;
        }
      });

      // add children
      element.props.children.forEach((child) => renderInner(child, domElem));

      // append it to the container
      container.appendChild(domElem);
    }
  }
};

const workLoop = () => {
  if (shouldRender && elementRoot && renderRoot) {
    while (renderRoot.firstChild) {
      renderRoot.removeChild(renderRoot.firstChild);
    }
    renderInner(elementRoot, renderRoot);
    shouldRender = false;
  }

  window.requestIdleCallback(workLoop);
};

window.requestIdleCallback(workLoop);

function useState<T>(initialValue: T): [T, (newValue: T) => void] {
  // initialize the entry for this component if necessary
  if (!(currentComponentKey in hooksByKey)) {
    hooksByKey[currentComponentKey] = [];
  }

  // initialize entry for this hook if necessary
  if (!hooksByKey[currentComponentKey][currentHookIndex]) {
    hooksByKey[currentComponentKey].push({ currentValue: initialValue });
  }

  const setState = (newValue) => {
    // update the value of the hook
    hooksByKey[currentComponentKey][currentHookIndex].currentValue = newValue;

    // trigger a rerender
    shouldRender = true;
  };

  return [
    hooksByKey[currentComponentKey][currentHookIndex].currentValue,
    setState,
  ];
}

const Spice = {
  createElement,
  render,
  useState,
};

/** @jsx Spice.createElement */

const RedText = ({ text }: { text: string }) => {
  const [counter, setCounter] = useState(0);

  return (
    <div className="red" onClick={() => setCounter(counter + 1)}>
      {text}: {counter}
    </div>
  );
};

const App = () => {
  return (
    <div>
      <h1 className="red">Hello from spice!</h1>
      <RedText key="cool-component-1" text="Good to have you here" />
    </div>
  );
};
Spice.render(<App />, document.getElementById("app"));

export default {};
