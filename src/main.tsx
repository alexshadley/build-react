import React from "react";
import "./style.css";
import { debounce } from "lodash";

type FunctionComponent = (props: { [key: string]: any }) => SpiceElement;

type SpiceElement = {
  type: string | FunctionComponent;
  props: { [key: string]: any } & { children: (SpiceElement | unknown)[] };
};

const isSpiceElement = (x: unknown): x is SpiceElement =>
  typeof x === "object" && "type" in x && "props" in x;

const createElement = (
  type: string | FunctionComponent,
  props: { [key: string]: any },
  ...children: (SpiceElement | unknown)[]
): SpiceElement => {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
};

// hook state
const hooks: any[] = [];
let currentHookIndex: number = 0;

// render state
let elementRoot: SpiceElement | null = null;
let renderRoot: HTMLElement | null = null;

const render = debounce((element: SpiceElement, container: HTMLElement) => {
  container.replaceChildren();
  // set up state
  currentHookIndex = 0;
  elementRoot = element;
  renderRoot = container;

  // do the render
  renderInner(element, container);
});

const renderInner = (element: SpiceElement, container: HTMLElement) => {
  if (typeof element.type === "function") {
    // run function component and render results
    const outputElem = element.type(element.props);
    renderInner(outputElem, container);
  } else {
    // make our new element
    const domElem = document.createElement(element.type);

    // add props
    Object.entries(element.props).map(([key, value]) => {
      if (key === "children") {
        // do nothing lol
      } else if (key === "onClick") {
        domElem.addEventListener("click", element.props[key]);
      } else if (key === "style") {
        // TODO: assign each key of style to the elem
      } else {
        domElem[key] = value;
      }
    });

    // add children
    element.props.children.forEach((child) => {
      if (isSpiceElement(child)) {
        renderInner(child, domElem);
      } else {
        const textNode = document.createTextNode(String(child));
        domElem.appendChild(textNode);
      }
    });

    // append it to the container
    container.appendChild(domElem);
  }
};

function useState<T>(initialValue: T): [T, (newValue: T) => void] {
  const index = currentHookIndex++;

  // initialize entry for this hook if necessary
  if (!hooks[index]) {
    hooks.push(initialValue);
  }

  const setState = (newValue) => {
    // update the value of the hook
    hooks[index] = newValue;

    // trigger a rerender
    render(elementRoot, renderRoot);
  };

  return [hooks[index], setState];
}

const Spice = {
  createElement,
  render,
  useState,
};

/** @jsx Spice.createElement */

const Counter = ({ text }: { text: string }) => {
  const [counter, setCounter] = useState(0);
  const [str, setStr] = useState("hi");

  return (
    <div
      className="red"
      onClick={() => {
        setCounter(counter + 1);
        setStr(str + str);
      }}
    >
      {text}: {counter} : {str}
    </div>
  );
};

const App = () => {
  return (
    <div>
      <h1 className="red">Hello from spice!</h1>
      <Counter text="Good to have you here" />
      <Counter text="Good to have you here" />
      <Counter text="Good to have you here" />
    </div>
  );
};
Spice.render(<App />, document.getElementById("app"));

export default {};
