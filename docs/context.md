# AI-Powered Health & Wellness App Documentation

This document provides a comprehensive overview of the app's flow and features, along with the chosen technical stack. The AI-powered health & wellness app is designed to deliver personalized fitness, nutrition, and wellness tracking. It integrates AI-generated meal and workout plans, expert consultations, progress tracking, and an engaging community to keep users motivated. The app is organized into seven key sections: **Welcome & Authentication**, **Home Screen**, **Diary**, **Report**, **Appointments**, **Community**, and **Profile**.

---

## Table of Contents

1. [Welcome & Authentication](#welcome--authentication)
2. [Home Screen](#home-screen)
3. [Diary](#diary)
4. [Report](#report)
5. [Appointments](#appointments)
6. [Community](#community)
7. [Profile](#profile)
8. [Tech Stack](#tech-stack)
9. [Conclusion](#conclusion)
10. [Database Schema](#database-schema)
11. [Optimal Folder Structure](#optimal-folder-structure)
12. [Folder Structure](#folder-structure)

---

## 1. Welcome & Authentication

### Welcome Screen
- **Purpose:**  
  Introduces users to the app's core benefits with a clean, inviting interface.
- **Design:**  
  Minimalist and modern, creating a positive first impression.

### Login Page
- **Functionality:**  
  - **User Input:** Fields for email and password.
  - **Validation:** Secure input verification with error handling for incorrect credentials.
- **Post-Login Flow:**  
  Redirects users to the **Home Screen** for immediate access to personalized features upon successful login.

### Sign-Up Page
- **Registration:**  
  - Users can create an account using their email.
  - Input fields include email, password, and additional profile information.
- **Verification:**  
  Requires email confirmation or additional verification steps for secure registration.

---

## 2. Home Screen

### Overview
- **Purpose:**  
  Serves as the main dashboard, providing an at-a-glance view of key health metrics and quick access to major functionalities.
- **Key Elements:**
  - **My Weight:** Displays current weight and tracks progress.
  - **My Achievements:** Highlights milestones and goals achieved.
  - **Reminders:** Notifications for workouts, meals, and consultations.
  - **Photo Album:** Quick access to upload and view progress photos.
  - **My Professionals:** Lists connected nutritionists, trainers, and wellness experts.
  - **Quick Links:** Shortcuts to detailed app features.

---

## 3. Diary

### Overview
- **Purpose:**  
  Acts as the central hub for daily logging and tracking.

### Features
- **Calendar View:**  
  Displays days of the week with visual streak counts.
- **Meal Logging:**  
  - **Sections:** Breakfast, Lunch, Dinner, Snacks, and Other (for custom entries).
  - **Customization:** Add, modify, or remove foods and meal plans.
- **Nutritional Tracking:**  
  - **Metrics:** Monitors macronutrients (Fat, Carbs, Protein) and calorie intake.
  - **Comparison:** Shows calories consumed versus the Recommended Daily Intake (RDI).
- **Water Tracker:**  
  Simple tool to log daily water consumption.
- **Daily Summary:**  
  Provides an overview of key metrics (e.g., "1600 calories remaining", "0 calories consumed", "0% of 1600 RDI").

---

## 4. Report

### Overview
- **Purpose:**  
  Offers detailed insights and visualizations of nutritional and fitness trends.

### Features
- **Data Visualization:**  
  Graphs and charts to display trends in calorie intake, nutrient balance, and weight changes.
- **Detailed Metrics:**  
  In-depth analysis of nutritional data and physical activity.
- **Insights & Recommendations:**  
  Data-driven suggestions to optimize meal and workout plans based on historical data.

---

## 5. Appointments

### Overview
- **Purpose:**  
  Provides a dedicated space for managing consultations and appointments with health professionals.

### Features
- **Calendar Integration:**  
  Displays scheduled appointments in a user-friendly calendar format.
- **Scheduling Tools:**  
  Options to book, reschedule, or cancel appointments.
  Integration with device calendars for automated reminders.
- **Consultation Management:**  
  Direct access to nutritionists, trainers, and wellness coaches for personalized guidance.

---

## 6. Community

### Overview
- **Purpose:**  
  Creates a social hub for users to connect, share experiences, and motivate each other.

### Features
- **Forums & Posts:**  
  Platforms for sharing wellness tips, personal success stories, and advice.
- **Community Challenges:**  
  Regularly organized challenges to encourage user engagement.
- **Messaging:**  
  Direct messaging and group chat functionalities for peer-to-peer interactions and communication with professionals.
- **Social Interactions:**  
  Options to like, comment on, and share posts within the community.

---

## 7. Profile

### Overview
- **Purpose:**  
  Manages user account details, settings, and historical data.

### Features
- **Personal Information:**  
  Update and manage user details such as name, age, weight, fitness goals, and preferences.
- **Settings:**  
  Customize notification preferences, privacy options, and display settings.
- **History & Achievements:**  
  View records of past meals, workouts, progress reports, and earned badges.
- **Connected Services:**  
  Manage linked expert consultations and integrations with third-party health devices.

---

## 8. Tech Stack

### Frontend
- **Framework:** React Native with TypeScript.
- **Tooling:**  
  - **Expo:** For rapid development and deployment.
  - **Expo Router:** For intuitive navigation management.

### Backend/Database
- **Service:** Supabase  
  Provides authentication, real-time data, and a scalable backend.

### UI Framework
- **Library:** React Native Paper  
  Offers pre-built, customizable UI components to ensure a consistent and modern look.

### AI Processing
- **Service:** DeepSeek  
  Handles AI-driven meal & workout plan generation, progress analysis, and personalized recommendations.

---

## 9. Conclusion

This documentation outlines the complete flow and features of the AI-powered health & wellness app, from user onboarding through daily tracking, detailed reporting, appointment management, community engagement, and profile settings. By leveraging the robust tech stack—including React Native, Supabase, React Native Paper, and DeepSeek—the app is built to deliver a seamless, engaging, and personalized user experience. Developers can use this guide as a blueprint to implement and maintain a high-quality health and wellness platform.

---

## 10. Database Schema

### Overview
The database schema is designed to efficiently store and manage user data, track progress, and support AI-driven features. The schema is implemented using Supabase, which provides real-time data synchronization and scalable backend services.

### Tables

- **Users**
  - **Fields:** id (PK), email, password_hash, name, age, weight, fitness_goals, created_at, updated_at
  - **Description:** Stores user account information and personal details.

- **Meals**
  - **Fields:** id (PK), user_id (FK), date, meal_type, food_items, calories, macronutrients, created_at
  - **Description:** Logs meals consumed by users, including nutritional information.

- **Workouts**
  - **Fields:** id (PK), user_id (FK), date, workout_type, duration, calories_burned, created_at
  - **Description:** Records workout sessions and related metrics.

- **Appointments**
  - **Fields:** id (PK), user_id (FK), professional_id (FK), date, time, status, created_at
  - **Description:** Manages user appointments with health professionals.

- **CommunityPosts**
  - **Fields:** id (PK), user_id (FK), content, likes, comments, created_at
  - **Description:** Stores posts made by users in the community section.

- **Achievements**
  - **Fields:** id (PK), user_id (FK), achievement_type, description, date_earned
  - **Description:** Tracks user achievements and milestones.

- **Professionals**
  - **Fields:** id (PK), name, specialty, contact_info, created_at
  - **Description:** Contains information about health professionals available for consultations.

---

## 11. Optimal Folder Structure

### Overview
The folder structure is organized to support modular development, making it easier to manage and scale the app. The structure is designed to separate concerns and promote code reusability.

### Structure

```
/app
  /assets
    /images
    /fonts
  /components
    /common
    /auth
    /home
    /diary
    /report
    /appointments
    /community
    /profile
  /contexts
  /hooks
  /navigation
  /screens
    /Auth
    /Home
    /Diary
    /Report
    /Appointments
    /Community
    /Profile
  /services
    /api
    /auth
    /database
  /styles
  /utils
  /App.tsx
  /index.js
```

---

## 12. Conclusion

This documentation outlines the complete flow and features of the AI-powered health & wellness app, from user onboarding through daily tracking, detailed reporting, appointment management, community engagement, and profile settings. By leveraging the robust tech stack—including React Native, Supabase, React Native Paper, and DeepSeek—the app is built to deliver a seamless, engaging, and personalized user experience. Developers can use this guide as a blueprint to implement and maintain a high-quality health and wellness platform.
