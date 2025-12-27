Feature: Admin Dashboard
  As an admin
  I want to view the dashboard overview
  So that I can monitor studio performance

  Background:
    Given I am logged in as an admin
    And I am on the admin dashboard

  @stats
  Scenario: View dashboard statistics
    Then I should see the active clients count
    And I should see the monthly revenue
    And I should see the attendance rate
    And I should see the pending payments count

  @navigation
  Scenario: Navigate to clients page
    When I click on "View all" clients link
    Then I should be on the clients page

  @navigation
  Scenario: Navigate to staff page
    When I click on "Staff" in the sidebar
    Then I should be on the staff management page

  @schedule
  Scenario: View today's schedule
    Then I should see the schedule card
    And I should see classes listed for today

  @notifications
  Scenario: Access notifications settings
    When I click on "Notifications" in the sidebar
    Then I should be on the notifications settings page
    And I should see notification preference options
