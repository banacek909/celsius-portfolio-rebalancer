import React from "react";
import { globalContext } from "../../store";

import { Button, Intent, TagProps, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, MultiSelect } from "@blueprintjs/select";

import { PortfolioCoin } from "../../store/types";

import { Logos } from "../../data/logos";
import { coinSymbolMap } from "../../data";

import {
  areCoinsEqual,
  arrayContainsCoin,
  createCoin,
  coinSelectProps,
  maybeAddCreatedCoinToArrays,
  maybeDeleteCreatedCoinFromArrays,
  //renderCreateCoinOption,
  SELECTABLE_COINS,
} from "./Coin";
//import { convertTypeAcquisitionFromJson } from "typescript";

const CoinMultiSelect = MultiSelect.ofType<PortfolioCoin>();

const INTENTS = [
  Intent.NONE,
  Intent.PRIMARY,
  Intent.SUCCESS,
  Intent.DANGER,
  Intent.WARNING,
];

export interface IMultiSelectExampleState {
  allowCreate: boolean;
  createdItems: PortfolioCoin[];
  fill: boolean;
  coins: PortfolioCoin[];
  hasInitialContent: boolean;
  intent: boolean;
  items: PortfolioCoin[];
  openOnKeyDown: boolean;
  popoverMinimal: boolean;
  resetOnSelect: boolean;
  tagMinimal: boolean;
}

export class MultiSelectCoin extends React.PureComponent {
  static contextType = globalContext;

  public state: IMultiSelectExampleState = {
    allowCreate: false,
    createdItems: [],
    fill: false,
    coins: this.context.globalState.portfolio,
    hasInitialContent: false,
    intent: false,
    items: coinSelectProps.items,
    openOnKeyDown: false,
    popoverMinimal: true,
    resetOnSelect: true,
    tagMinimal: true,
  };

  private handleAllowCreateChange = this.handleSwitchChange("allowCreate");

  private handleKeyDownChange = this.handleSwitchChange("openOnKeyDown");

  private handleResetChange = this.handleSwitchChange("resetOnSelect");

  private handlePopoverMinimalChange =
    this.handleSwitchChange("popoverMinimal");

  private handleTagMinimalChange = this.handleSwitchChange("tagMinimal");

  private handleFillChange = this.handleSwitchChange("fill");

  private handleIntentChange = this.handleSwitchChange("intent");

  private handleInitialContentChange =
    this.handleSwitchChange("hasInitialContent");

  public render() {
    const {
      allowCreate,
      coins,
      //     hasInitialContent,
      tagMinimal,
      //     popoverMinimal,
      //    ...flags
    } = this.state;

    const getTagProps = (_value: React.ReactNode, index: number): TagProps => ({
      intent: this.state.intent ? INTENTS[index % INTENTS.length] : Intent.NONE,
      minimal: tagMinimal,
    });

    const initialContent = this.state.hasInitialContent ? (
      <MenuItem
        disabled={true}
        text={`${SELECTABLE_COINS.length} items loaded.`}
      />
    ) : // explicit undefined (not null) for default behavior (show full list)
    undefined;
    const maybeCreateNewItemFromQuery = allowCreate ? createCoin : undefined;
    /*const maybeCreateNewItemRenderer = allowCreate
      ? renderCreateCoinOption
      : null;*/

    const clearButton =
      coins.length > 0 ? (
        <Button icon="cross" minimal={true} onClick={this.handleClear} />
      ) : undefined;

    return (
      <CoinMultiSelect
        createNewItemFromQuery={maybeCreateNewItemFromQuery}
        initialContent={initialContent}
        itemRenderer={this.renderCoin}
        itemsEqual={areCoinsEqual}
        // we may customize the default coinSelectProps.items by
        // adding newly created items to the list, so pass our own
        items={this.state.items}
        placeholder={"Add Coin"}
        noResults={<MenuItem disabled={true} text="No results." />}
        onItemSelect={this.handleCoinSelect}
        onItemsPaste={this.handleCoinsPaste}
        popoverProps={{ minimal: true }}
        fill={true}
        tagRenderer={this.renderTag}
        tagInputProps={{
          onRemove: this.handleTagRemove,
          rightElement: clearButton,
          tagProps: getTagProps,
        }}
        selectedItems={this.state.coins}
      />
    );
  }

  private renderTag = (coin: PortfolioCoin) => {
    const logo = Logos[coin.coin];

    const style = { display: "flex", alignItems: "center" };

    return (
      <div style={style}>
        <img
          src={logo}
          width={16}
          height={16}
          style={{ marginRight: 5 }}
          alt={coin.coin}
        />
        {coin.coin}
      </div>
    );
  };

  private renderCoin: ItemRenderer<PortfolioCoin> = (
    coin,
    { modifiers, handleClick }
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    const logo = Logos[coin.coin];

    const style = { display: "flex", alignItems: "center" };

    const text = (
      <div style={style}>
        <img
          src={logo}
          width={25}
          height={25}
          style={{ marginRight: 8 }}
          alt={coin.coin}
        />
        {`${coin.coin} - ${coinSymbolMap[coin.coin].name}`}
      </div>
    );
    return (
      <MenuItem
        active={modifiers.active}
        icon={this.isCoinSelected(coin) ? "tick" : "blank"}
        key={coin.coin}
        onClick={handleClick}
        text={text}
        shouldDismissPopover={false}
      />
    );
  };

  private handleTagRemove = (_tag: React.ReactNode, index: number) => {
    this.deselectCoin(index);
  };

  private getSelectedCoinIndex(coin: PortfolioCoin) {
    return this.state.coins.findIndex((f) => f.coin === coin.coin);
  }

  private isCoinSelected(coin: PortfolioCoin) {
    return this.getSelectedCoinIndex(coin) !== -1;
  }

  private selectCoin(coin: PortfolioCoin) {
    this.selectCoins([coin]);
  }

  private selectCoins(coinsToSelect: PortfolioCoin[]) {
    const { createdItems, coins, items } = this.state;

    let nextCreatedItems = createdItems.slice();
    let nextCoins = coins.slice();
    let nextItems = items.slice();

    coinsToSelect.forEach((coin) => {
      const results = maybeAddCreatedCoinToArrays(
        nextItems,
        nextCreatedItems,
        coin
      );
      nextItems = results.items;
      nextCreatedItems = results.createdItems;
      // Avoid re-creating an item that is already selected (the "Create
      // Item" option will be shown even if it matches an already selected
      // item).
      nextCoins = !arrayContainsCoin(nextCoins, coin)
        ? [...nextCoins, coin]
        : nextCoins;
    });

    this.setState({
      createdItems: nextCreatedItems,
      coins: nextCoins,
      items: nextItems,
    });

    this.context.dispatch({ type: "ADD_COIN", payload: nextCoins });
  }

  private deselectCoin(index: number) {
    const { coins } = this.state;

    const coin = coins[index];
    const { createdItems: nextCreatedItems, items: nextItems } =
      maybeDeleteCreatedCoinFromArrays(
        this.state.items,
        this.state.createdItems,
        coin
      );

    // Delete the item if the user manually created it.
    this.setState({
      createdItems: nextCreatedItems,
      coins: coins.filter((_coin, i) => i !== index),
      items: nextItems,
    });

    this.context.dispatch({
      type: "REMOVE_COIN",
      payload: coins.filter((_coin, i) => i !== index),
    });
  }

  private handleCoinSelect = (coin: PortfolioCoin) => {
    if (!this.isCoinSelected(coin)) {
      this.selectCoin(coin);
    } else {
      this.deselectCoin(this.getSelectedCoinIndex(coin));
    }
  };

  private handleCoinsPaste = (coins: PortfolioCoin[]) => {
    // On paste, don't bother with deselecting already selected values, just
    // add the new ones.
    this.selectCoins(coins);
  };

  private handleSwitchChange(prop: keyof IMultiSelectExampleState) {
    return (event: React.FormEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      this.setState((state) => ({ ...state, [prop]: checked }));
    };
  }

  private handleClear = () => this.setState({ coins: [] });
}
