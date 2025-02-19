import hb from "handlebars";

const asAnchor = (emoji: string, name: string): hb.SafeString => {
    const fullString = `${emoji} ${name}`;
    const isFirst = (idx: number) => idx === 0;
    const isLast = (idx: number) => idx === fullString.length - 1;
    const isFirstOrLast = (idx: number) => isFirst(idx) || isLast(idx);

    const proccessed = (
        fullString.toLowerCase()
            .split('')
            .map((char, idx) => {
                return char.match(/[a-zA-Z0-9_-]/) ? char : (!isFirstOrLast(idx) ? '-' : '');
            })
            .join('')
    );

    return new hb.SafeString(`#${proccessed}`);
};

const asEmoji = (emojiName: string): hb.SafeString => {
    return new hb.SafeString(`:${emojiName}:`);
};

export default {
    asAnchor,
    asEmoji
}