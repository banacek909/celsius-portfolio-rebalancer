import { MenuItem } from "@blueprintjs/core";
import { Select, ItemPredicate, ItemRenderer } from "@blueprintjs/select";

import { Logos } from "../../data/logos";

export interface CoinSelect {
  coin: string;
  id: string;
  name: string;
}

function escapeRegExpChars(text: string) {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function highlightText(text: string, query: string) {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join("|"), "gi");
  const tokens: React.ReactNode[] = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const length = match[0].length;
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }
    lastIndex = regexp.lastIndex;
    tokens.push(<strong key={lastIndex}>{match[0]}</strong>);
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

export const itemLogoText = (
  coin: CoinSelect,
  highlight: boolean,
  query: string
) => {
  const text = highlight
    ? highlightText(`${coin.coin} - ${coin.name}`, query)
    : `${coin.coin} - ${coin.name}`;
  const logo = Logos[coin.coin];

  const style = { display: "flex", alignItems: "center" };

  const logo_text = (
    <div style={style}>
      <img
        src={logo}
        width={25}
        height={25}
        style={{ marginRight: 8 }}
        alt={coin.name}
      />
      {text}
    </div>
  );
  return logo_text;
};

export const renderCoin: ItemRenderer<CoinSelect> = (
  coin,
  { handleClick, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }

  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={coin.coin}
      onClick={handleClick}
      text={itemLogoText(coin, true, query)}
    />
  );
};

export const filterCoin: ItemPredicate<CoinSelect> = (
  query,
  coin,
  _index,
  exactMatch
) => {
  const normalizedTitle = `${coin.coin} - ${coin.name}`.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
  }
};

// Select<T> is a generic component to work with your data types.
// In TypeScript, you must first obtain a non-generic reference:
export const SelectCoin = Select.ofType<CoinSelect>();
