Feature: Client Dashboard
  As a client
  I want to access my personal dashboard
  So that I can view my classes and manage my account

  Background:
    Given I am logged in as a client
    And I am on the client dashboard

  @welcome
  Scenario: View welcome message
    Then I should see a personalized welcome message
    And I should see my upcoming classes

  @classes
  Scenario: View my classes
    When I click on "Classes" in the sidebar
    Then I should see the class calendar
    And I should be able to switch between calendar views

  @settings
  Scenario: Access profile settings
    When I click on "Settings" in the sidebar
    Then I should be on the settings page
    And I should see the profile tab active

  @settings
  Scenario: Update profile information
    When I click on "Settings" in the sidebar
    And I change my phone number
    And I click "Save changes"
    Then I should see a success message

  @billing
  Scenario: View billing information
    When I click on "Settings" in the sidebar
    And I click on the "Billing" tab
    Then I should see my current plan
    And I should see my billing history

  @support
  Scenario: Access support chat
    When I click on "Support" in the sidebar
    Then I should see the support chat interface
    And I should be able to type a message
