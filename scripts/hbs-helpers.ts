import hb from "handlebars";

const asAnchor = (name: string): hb.SafeString => {
    return new hb.SafeString(name.toLowerCase().replace(/\s/g, "-"));
};

const asEmoji = (emojiName: string): hb.SafeString => {
    return new hb.SafeString(`:${emojiName}:`);
};

export default {
    asAnchor,
    asEmoji
}