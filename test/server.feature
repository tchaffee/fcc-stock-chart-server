Feature: A websocket API client can add and remove stock symbols
  As a programmer on the client side using a websocket service
  I want to add and remove stocks

  Scenario: Bad websocket address
    Given I use a bad address like "ws://foobarfake/"
    And I make a connection "bad"
    And I open a connection "bad" and catch errors
    Then Error with code "ENOTFOUND" should be caught

  Scenario: Reset the list of stocks
    Given I make a connection "primary"
    And I open a connection "primary"
    And I add a stock to the list on connection "primary"
    When I send the following JSON string using connection "primary":
    """
    {
      "action": "RESET_STOCKS"
    }
    """
    Then I should eventually get an empty list of "stocks" from connection "primary"

  Scenario: Add a stock
    Given I make a connection "primary"
    And I open a connection "primary"
    And The list of stocks is reset to empty on connection "primary"
    When I send the following JSON string using connection "primary":
    """
    {
      "action": "ADD_STOCK",
      "symbol": "GOOGL"
    }
    """
    Then I should eventually get a message from connection "primary" containing:
    """
    "GOOGL"
    """

  Scenario: I can add more than one stock
    Given I make a connection "primary"
    And I open a connection "primary"
    And The list of stocks is reset to empty on connection "primary"
    When I send the following JSON string using connection "primary":
    """
    {
      "action": "ADD_STOCK",
      "symbol": "GOOGL"
    }
    """
    And I send the following JSON string using connection "primary":
    """
    {
      "action": "ADD_STOCK",
      "symbol": "IBM"
    }
    """
    Then I should eventually get a list of "stocks" from connection "primary" containing:
      | GOOGL | IBM |

  Scenario: I can remove a stock
    Given I make a connection "primary"
    And I open a connection "primary"
    When I send the following JSON string using connection "primary":
    """
    {
      "action": "REMOVE_STOCK",
      "symbol": "GOOGL"
    }
    """
    Then I should eventually get a message from connection "primary" NOT containing:
    """
    "GOOGL"
    """

  Scenario: I get an error if I send an unknown action
    Given I make a connection "primary"
    And I open a connection "primary"
    When I send the following JSON string using connection "primary":
    """
    {
      "action": "foobar"
    }
    """
    Then I should eventually get a message from connection "primary" containing:
    """
    {"error":"Unknown action: 'foobar'"}
    """

  Scenario: Only the sending client gets the error
    Given I make a connection "primary"
    And I open a connection "primary"
    And I listen for a message on connection "primary"
    And I make a connection "secondary"
    And I open a connection "secondary"
    When I send the following JSON string using connection "primary":
    """
    {
      "action": "foobar"
    }
    """
    Then I should get a listened message from connection "primary" containing:
    """
    {"error":"Unknown action: 'foobar'"}
    """
    And I should NOT get a message from connection "secondary"

  Scenario: All clients are notified when a new stock is added
    Given I make a connection "primary"
    And I open a connection "primary"
    And I listen for a message on connection "primary"
    And I make a connection "secondary"
    And I open a connection "secondary"
    And I listen for a message on connection "secondary"
    When I send the following JSON string using connection "secondary":
    """
    {
      "action": "ADD_STOCK",
      "symbol": "SEARS"
    }
    """
    Then I should get a listened message from connection "primary" containing:
    """
    "SEARS"
    """
    And I should get a listened message from connection "secondary" containing:
    """
    "SEARS"
    """
