import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../src/app/page";

describe("Home page", () => {
  it("renders the product title", () => {
    expect(renderToStaticMarkup(<Home />)).toContain("Brújula Financiera IA");
  });
});
