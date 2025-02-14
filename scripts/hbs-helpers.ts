import hb from "handlebars";

const asAnchor = (emoji: string, name: string): hb.SafeString => {
    return new hb.SafeString(
        '#' + `${emoji} ${name}`
            .toLowerCase()
            .split('')
            .map((char, idx) => {
                return char.match(/[a-zA-Z0-9_-]/) ? char : (!!idx ? '-' : '');
            })
            .join('')
    );
};

const asEmoji = (emojiName: string): hb.SafeString => {
    return new hb.SafeString(`:${emojiName}:`);
};

export default {
    asAnchor,
    asEmoji
}