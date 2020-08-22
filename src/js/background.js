chrome.runtime.onInstalled.addListener(handleInstalled);

function handleInstalled() {
  {
    // If `ruleIds` is `undefined`, all registered rules of this extension are removed.
    let ruleIds = undefined;
    chrome.declarativeContent.onPageChanged.removeRules(
      ruleIds,
      callbackWhenRulesWereRemoved
    );
  }

  function callbackWhenRulesWereRemoved() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: 'www.notion.so' },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  }
}
