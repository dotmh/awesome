import assert from "node:assert";

interface Base {
    name: string;
    description: string;
}

export interface Resource extends Base {
    link?: string;
    badge?: string;
}

export interface Data extends Base {
    emoji: string;
    badges?: string[];
    resources: Resource[];
}

export interface Group extends Base {
    id: string;
    emoji: string;
    children: Data[];
}

export interface MetaData {
    today: string;
    groups: number;
    categories: number;
    resources: number;
}

export function assertIsData(value: unknown): asserts value is Data {
    assert(typeof value === "object", "Data must be an object");
    assert(!Array.isArray(value), "Data must not be an array");

    const data = value as Partial<Data>;

    assert(typeof data.description === "string", "Data description must be a string");
    assert(typeof data.name === "string" && data.name?.length > 0, "Data name must not be empty");
    assert(typeof data.emoji === "string" && data.emoji.length > 0, "Data emoji must not be empty");
    assert(data.resources !== undefined, "Data resources must be defined");
    assert(Array.isArray(data.resources), "Data resources must be an array");

    assert(data.resources && data.resources.every(resource => {
        assert(typeof resource.description === "string", "Resource description must be a string");
        assert(resource.name === undefined || typeof resource.name === "string", "Resource name must be a string");
        assert(resource.link === undefined || typeof resource.link === "string", "Resource link must be a string");
        assert(resource.badge === undefined || typeof resource.badge === "string", "Resource badge must be a string");
        return true;
    }), "Resources must be an array of objects with description, name, link, and badge properties");
}