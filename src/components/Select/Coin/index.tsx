import * as React from "react";

import { MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer } from "@blueprintjs/select";

import { coinSymbolMap, coinGeckoMap } from "../../../data";

import { PortfolioCoin } from "../../../store/types";

const Non_Stable_Coins: PortfolioCoin[] = [];
Object.keys(coinSymbolMap).forEach((key) => {
  //if (!coinSymbolMap[key].stable_coin) {
  Non_Stable_Coins.push({
    coin: key,
    amount: 0,
    value: 0,
    rebalance: {
      threshold: 1,
      percent: 0,
      value: 0,
    },
  });
  //}
});
export const SELECTABLE_COINS: PortfolioCoin[] = Non_Stable_Coins; // NB: Changed to include all coins

export const renderCoin: ItemRenderer<PortfolioCoin> = (
  coin,
  { handleClick, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }

  return (
    <MenuItem
      active={modifiers.active}
      disabled={!modifiers.disabled}
      key={coinGeckoMap.coin}
      onClick={handleClick}
      text={coin.coin}
    />
  );
};

export const renderCreateCoinOption = (
  query: string,
  active: boolean,
  handleClick: React.MouseEventHandler<HTMLElement>
) => (
  <MenuItem
    icon="add"
    text={`Create "${query}"`}
    active={active}
    onClick={handleClick}
    shouldDismissPopover={false}
  />
);

export const filterCoin: ItemPredicate<PortfolioCoin> = (
  query,
  coin,
  _index,
  exactMatch
) => {
  const normalizedTitle = coin.coin.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
  }
};

/*function highlightText(text: string, query: string) {
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
}*/

function escapeRegExpChars(text: string) {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

export const coinSelectProps = {
  itemPredicate: filterCoin,
  itemRenderer: renderCoin,
  items: SELECTABLE_COINS,
};

export function createCoin(title: string): PortfolioCoin {
  return {
    coin: title,
    amount: 0,
    value: 0,
    rebalance: {
      threshold: 1,
      percent: 0,
      value: 0,
    },
  };
}

export function areCoinsEqual(coinA: PortfolioCoin, coinB: PortfolioCoin) {
  // Compare only the titles (ignoring case) just for simplicity.
  return coinA.coin.toLowerCase() === coinB.coin.toLowerCase();
}

export function doesCoinEqualQuery(coin: PortfolioCoin, query: string) {
  return coin.coin.toLowerCase() === query.toLowerCase();
}

export function arrayContainsCoin(
  coins: PortfolioCoin[],
  coinToFind: PortfolioCoin
): boolean {
  return coins.some((coin: PortfolioCoin) => coin.coin === coinToFind.coin);
}

export function addCoinToArray(
  coins: PortfolioCoin[],
  coinToAdd: PortfolioCoin
) {
  return [...coins, coinToAdd];
}

export function deleteCoinFromArray(
  coins: PortfolioCoin[],
  coinToDelete: PortfolioCoin
) {
  return coins.filter((coin) => coin !== coinToDelete);
}

export function maybeAddCreatedCoinToArrays(
  items: PortfolioCoin[],
  createdItems: PortfolioCoin[],
  coin: PortfolioCoin
): { createdItems: PortfolioCoin[]; items: PortfolioCoin[] } {
  const isNewlyCreatedItem = !arrayContainsCoin(items, coin);
  return {
    createdItems: isNewlyCreatedItem
      ? addCoinToArray(createdItems, coin)
      : createdItems,
    // Add a created coin to `items` so that the coin can be deselected.
    items: isNewlyCreatedItem ? addCoinToArray(items, coin) : items,
  };
}

export function maybeDeleteCreatedCoinFromArrays(
  items: PortfolioCoin[],
  createdItems: PortfolioCoin[],
  coin: PortfolioCoin
): { createdItems: PortfolioCoin[]; items: PortfolioCoin[] } {
  const wasItemCreatedByUser = arrayContainsCoin(createdItems, coin);

  // Delete the item if the user manually created it.
  return {
    createdItems: wasItemCreatedByUser
      ? deleteCoinFromArray(createdItems, coin)
      : createdItems,
    items: wasItemCreatedByUser ? deleteCoinFromArray(items, coin) : items,
  };
}
