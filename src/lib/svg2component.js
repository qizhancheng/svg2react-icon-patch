const cheerio = require("cheerio");
const forEach = require("lodash.foreach");
const camelCase = require("lodash.camelcase");
const esformatter = require("esformatter");
esformatter.register(require("esformatter-jsx"));

module.exports = (name, svg, options) => {
    const $ = cheerio.load(svg, {
        xmlMode: true
    });
    const $svg = $("svg");
    toReactAttributes($svg, $);
    const children = $svg.html();
    const viewBox = $svg.attr("viewBox")
        ? `viewBox="${$svg.attr("viewBox")}"`
        : "";
    const code = options.isTypeScriptOutput
        ? `
      import * as React from 'react';
      export interface ${name}Props extends React.SVGAttributes<SVGElement> {
      }
      ${
          options.namedExport ? "export " : ""
      }const ${name}: React.SFC<${name}Props> = ({className, ...props}) => (
				<i className={\`anticon\$\{className ? " " + className : ""}\`}>
					<svg
						${viewBox}
						fill="currentColor"
						width="1em"
						height="1em"
						{...props}
					>
						${children}
					</svg>
				</i>
      );
      ${options.namedExport ? "" : `export default ${name};`}
    `
        : `
      import React from 'react';
      ${
          options.namedExport ? "export " : ""
      }const ${name} = ({className, ...props}) => (
				<i className={\`anticon\$\{className ? " " + className : ""}\`}>
        <svg
          ${viewBox}
          fill="currentColor"
          width="1em"
          height="1em"
          {...props}
        >
          ${children}
				</svg>
				</i>
      );
      ${options.namedExport ? "" : `export default ${name};`}
    `;

    return [
        "/* eslint-disable */",
        "/* tslint:disable */",
        esformatter.format(code).trim(),
        "/* tslint:enable */",
        "/* eslint-enable */",
        ""
    ].join("\n");
};

const resetIfNotNone = val => (val === "none" ? "none" : "currentColor");
const attributesToRename = { "xlink:href": "xlinkHref", class: "className" };
const attributesToReplace = { fill: resetIfNotNone, stroke: resetIfNotNone };

function toReactAttributes($el, $) {
    forEach($el.attr(), (val, name) => {
        if (attributesToReplace[name]) {
            $el.attr(name, attributesToReplace[name](val));
        }

        if (name.indexOf("-") === -1 && !attributesToRename[name]) {
            return;
        }

        const newName = attributesToRename[name] || camelCase(name);
        $el.attr(newName, val).removeAttr(name);
    });

    if ($el.children().length === 0) {
        return false;
    }

    $el.children().each((index, el) => {
        const $child = $(el);
        toReactAttributes($child, $);
    });
}
