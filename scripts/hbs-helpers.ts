import hb from "handlebars";

const asAnchor = (name: string): hb.SafeString => {
    return new hb.SafeString(name.toLowerCase().replace(/\s/g, "-"));
};

export default {
    asAnchor
}