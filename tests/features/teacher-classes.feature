Feature: Teacher Classes Management
  As a teacher
  I want to manage my classes
  So that I can organize my schedule and track attendance

  Background:
    Given I am on the teacher classes page

  @list-view
  Scenario: View classes in list mode
    Then I should see the "My Classes" heading
    And I should see the list view toggle active
    And I should see classes grouped by date

  @calendar-view
  Scenario: Switch to calendar view
    When I click the calendar view toggle
    Then I should see the calendar grid
    And I should see classes displayed on the calendar
    And I should see the calendar legend

  @create-class
  Scenario: Open create class modal
    When I click the "Create Class" button
    Then I should see the create class modal
    And I should see the class name input
    And I should see the class type selector
    And I should see the date picker
    And I should see the time picker

  @create-class
  Scenario: Create a new class successfully
    When I click the "Create Class" button
    And I fill in the class name with "Advanced Yoga"
    And I select class type "Yoga"
    And I select a future date
    And I set the time to "10:00"
    And I click the "Create Class" submit button
    Then I should see a success message

  @start-class
  Scenario: Start a scheduled class
    Given there is a scheduled class
    When I click "Start class" on the class card
    Then I should see a confirmation message with class details

  @attendance
  Scenario: Take attendance for in-progress class
    Given there is an in-progress class
    When I click "Take attendance" on the class card
    Then I should see the attendance interface

  @view-students
  Scenario: View enrolled students
    When I click "View students" on a class card
    Then I should see the list of enrolled students
    And each student should show their name and initials

  @filter
  Scenario: Filter classes by status
    When I select "Completed" from the status filter
    Then I should only see completed classes

  @filter
  Scenario: Filter classes by location
    When I select "FlexiWell Jardins" from the location filter
    Then I should only see classes from that location

  @search
  Scenario: Search for a class
    When I type "Pilates" in the search box
    Then I should only see Pilates classes
