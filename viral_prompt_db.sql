-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 13, 2026 at 12:01 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `viral_prompt_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `message`, `created_at`) VALUES
(1, 'test', 'test@gmail.com', '1234567899', 'test', '2026-05-11 09:47:48'),
(2, 'test', 'test@gmail.com', '1234567899', 'test', '2026-05-11 09:50:17'),
(3, 'test', 'test@gmail.com', '1234567899', 'test', '2026-05-11 09:50:40');

-- --------------------------------------------------------

--
-- Table structure for table `prompts`
--

CREATE TABLE `prompts` (
  `id` int(11) NOT NULL,
  `type` enum('image','video') DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT 'Trending',
  `before_image` varchar(255) DEFAULT NULL,
  `after_image` varchar(255) DEFAULT NULL,
  `price_credits` int(11) DEFAULT 0,
  `before_media` varchar(255) DEFAULT NULL,
  `after_media` varchar(255) DEFAULT NULL,
  `actual_prompt` text DEFAULT NULL,
  `usage_instruction` text DEFAULT NULL,
  `credit_cost` int(11) DEFAULT 2,
  `fake_views` int(11) DEFAULT 0,
  `is_landing_page` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `before_video` text DEFAULT NULL,
  `after_video` text DEFAULT NULL,
  `how_to_use` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `prompts`
--

INSERT INTO `prompts` (`id`, `type`, `title`, `description`, `category`, `before_image`, `after_image`, `price_credits`, `before_media`, `after_media`, `actual_prompt`, `usage_instruction`, `credit_cost`, `fake_views`, `is_landing_page`, `created_at`, `before_video`, `after_video`, `how_to_use`) VALUES
(1, 'image', 'NEW VIRAL TRENDING PROMT', 'gfhthththth', 'Trending', 'before_image-1778077678668.jpeg', 'after_image-1778077678668.jpeg', 2, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-06 14:27:58', NULL, NULL, NULL),
(2, 'image', 'New', 'jhgdjhsg', 'Trending', 'before_image-1778154693637.jpg', 'after_image-1778154693638.png', 1, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-07 11:51:33', NULL, NULL, NULL),
(3, 'image', 'New 2', 'test', 'Trending', 'before_image-1778222740650.jpg', 'after_image-1778222740651.png', 1, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-08 06:45:40', NULL, NULL, NULL),
(4, 'image', 'New 3', 'test', 'Trending', 'before_image-1778222740650.jpg', 'after_image-1778222740651.png', 1, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-08 06:45:40', NULL, NULL, NULL),
(5, 'video', 'New 4', 'test', 'Trending', 'before_image-1778222740650.jpg', 'after_image-1778222740651.png', 1, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-08 06:45:40', NULL, NULL, NULL),
(6, 'image', 'New 5', 'test', 'Trending', 'before_image-1778222740650.jpg', 'after_image-1778222740651.png', 1, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-08 06:45:40', NULL, NULL, NULL),
(7, 'image', 'New 6', 'test', 'Trending', 'before_image-1778222740650.jpg', 'after_image-1778222740651.png', 1, NULL, NULL, NULL, NULL, 2, 0, 1, '2026-05-08 06:45:40', NULL, NULL, NULL),
(9, 'image', 'New Prompt Added', 'New Prompt Added Des', 'Trending', 'before_image-1778480255074.png', 'after_image-1778480255081.jpeg', 2, NULL, NULL, NULL, NULL, 2, 100, 1, '2026-05-11 06:17:35', NULL, NULL, NULL),
(10, 'image', 'New 7', 'New 7', 'Trending', 'before_image-1778483366295.jpg', 'after_image-1778483366296.png', 1, NULL, NULL, NULL, NULL, 2, 120, 1, '2026-05-11 07:09:26', NULL, NULL, NULL),
(11, 'image', 'New 8', 'New 8', 'Trending', 'before_image-1778483431338.jpg', 'after_image-1778483431341.png', 5, NULL, NULL, NULL, NULL, 2, 111, 1, '2026-05-11 07:10:31', NULL, NULL, NULL),
(12, 'video', 'New 9', 'New 9', 'Trending', NULL, NULL, 5, NULL, NULL, NULL, NULL, 2, 110, 1, '2026-05-11 07:11:10', 'https://www.w3schools.com/tags/movie.mp4', 'https://www.w3schools.com/tags/movie.mp4', '1. Copy'),
(13, 'image', 'new', 'jjjj', 'Trending', 'before_image-1778582027678.png', 'after_image-1778582027684.png', 1, NULL, NULL, NULL, NULL, 2, 110, 1, '2026-05-12 10:33:47', NULL, NULL, 'ddd');

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` int(11) NOT NULL,
  `site_title` varchar(100) DEFAULT 'VIRAL PROMPT',
  `site_description` text DEFAULT NULL,
  `footer_description` text DEFAULT NULL,
  `site_logo` varchar(255) DEFAULT NULL,
  `header_logo` varchar(255) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_call` varchar(15) DEFAULT NULL,
  `whatsapp_link` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(50) DEFAULT NULL,
  `telegram_link` varchar(255) DEFAULT NULL,
  `instagram_link` varchar(255) DEFAULT NULL,
  `youtube_link` varchar(255) DEFAULT NULL,
  `apk_url` varchar(255) DEFAULT NULL,
  `min_deposit` int(11) DEFAULT 50,
  `referral_bonus` int(11) DEFAULT 10,
  `maintenance_mode` tinyint(1) DEFAULT 0,
  `maintenance_text` text DEFAULT NULL,
  `upi_id` varchar(255) DEFAULT NULL,
  `paytm_mid` varchar(100) DEFAULT NULL,
  `paytm_mkey` varchar(255) DEFAULT NULL,
  `paytm_qr` varchar(255) DEFAULT NULL,
  `bharatpe_mid` varchar(100) DEFAULT NULL,
  `bharatpe_token` varchar(100) DEFAULT NULL,
  `notification_text` text DEFAULT NULL,
  `notification_title` varchar(255) DEFAULT NULL,
  `notification_status` tinyint(1) DEFAULT 1,
  `popup_status` tinyint(1) DEFAULT 1,
  `support_text` text DEFAULT NULL,
  `seo_tags` text DEFAULT NULL,
  `copyright_text` varchar(255) DEFAULT NULL,
  `response_time` varchar(50) DEFAULT NULL,
  `popup_message` text DEFAULT NULL,
  `refer_percent` int(11) DEFAULT 10,
  `how_to_use` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `site_title`, `site_description`, `footer_description`, `site_logo`, `header_logo`, `contact_email`, `contact_call`, `whatsapp_link`, `whatsapp_number`, `telegram_link`, `instagram_link`, `youtube_link`, `apk_url`, `min_deposit`, `referral_bonus`, `maintenance_mode`, `maintenance_text`, `upi_id`, `paytm_mid`, `paytm_mkey`, `paytm_qr`, `bharatpe_mid`, `bharatpe_token`, `notification_text`, `notification_title`, `notification_status`, `popup_status`, `support_text`, `seo_tags`, `copyright_text`, `response_time`, `popup_message`, `refer_percent`, `how_to_use`) VALUES
(1, 'VIRAL PROMPT', 'Maxime eum adipisici', NULL, NULL, 'header_logo-1778503562487.png', 'qogedujob@mailinator.com', '1234567890', 'Sunt facere qui aute', NULL, 'Similique omnis quas', NULL, NULL, 'Illo quibusdam reici', 1, 10, 0, NULL, NULL, 'FmPlkP83161303164473', 'FmPlkP83161303164473', 'paytm_qr-1778491289437.png', '44621133', '93fac3fff3f340dcbadc943c06a72bab', 'AI Casino Prompt is trending now. Unlock before it goes viral.', 'New Viral Prompt Added', 1, 0, NULL, 'Suscipit ex non omni', NULL, NULL, NULL, 5, '1. Copy prompt\r\n2. Paste into ChatGPT or Other AI\r\n3. Generate content');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `order_id` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `credits_added` int(11) DEFAULT NULL,
  `utr_number` varchar(100) DEFAULT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `type` enum('deposit','withdraw','referral','unlock') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `order_id`, `user_id`, `amount`, `credits_added`, `utr_number`, `status`, `type`, `created_at`) VALUES
(1, '432fds', 4, 100.00, 100, '5435234543werw', 'success', 'deposit', '2026-05-11 10:14:39'),
(2, 'ADMIN1778567893016', 5, 100.00, 100, 'ADMIN-ADD', 'success', 'deposit', '2026-05-12 06:38:13'),
(3, 'ADMIN1778567932839', 5, 50.00, 50, 'ADMIN-DEDUCT', 'success', 'withdraw', '2026-05-12 06:38:52'),
(4, 'WD1778568646459', 5, 10.00, 0, 'example@ppl', 'failed', 'withdraw', '2026-05-12 06:50:46'),
(5, 'WD1778569000474', 5, 10.00, 0, 'example@paytm', 'pending', 'withdraw', '2026-05-12 06:56:40'),
(7, 'WD1778578928897', 3, 10.00, 0, 'example1@paytm', 'pending', 'withdraw', '2026-05-12 09:42:08'),
(11, 'T2605131214358373114762', 8, 20.00, 20, 'T2605131214358373114762', 'success', 'deposit', '2026-05-13 06:59:28'),
(12, 'T2605131214358373114762r', 7, 1.00, 1, 'T2605131214358373114762r', 'success', 'referral', '2026-05-13 06:59:28'),
(13, '613354107235', 3, 10.00, 10, '613354107235', 'success', 'deposit', '2026-05-13 09:00:18');

-- --------------------------------------------------------

--
-- Table structure for table `unlocks`
--

CREATE TABLE `unlocks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `prompt_id` int(11) DEFAULT NULL,
  `unlocked_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `unlocks`
--

INSERT INTO `unlocks` (`id`, `user_id`, `prompt_id`, `unlocked_at`) VALUES
(2, 3, 7, '2026-05-08 08:40:24'),
(3, 3, 3, '2026-05-08 09:43:06'),
(4, 3, 4, '2026-05-08 09:44:11'),
(5, 3, 1, '2026-05-08 10:48:05'),
(6, 3, 12, '2026-05-11 10:56:09'),
(7, 3, 13, '2026-05-12 10:44:09');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `plain_password` varchar(255) DEFAULT NULL,
  `wallet_credits` int(11) DEFAULT 0,
  `referral_code` varchar(20) DEFAULT NULL,
  `referred_by` varchar(20) DEFAULT NULL,
  `type` int(1) NOT NULL DEFAULT 0,
  `upi_id` varchar(255) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `mobile`, `city`, `password`, `plain_password`, `wallet_credits`, `referral_code`, `referred_by`, `type`, `upi_id`, `status`, `created_at`) VALUES
(1, 'Munna kumar', 'mksdigitaltech@gmail.com', '7219785445', 'Bihar', '$2a$10$tqoSjaBcyHrifLPiS7xwTOoEZPMNrSlzs2RbZ0ZQwlKOeywu7fMO2', 'admin@123', 99, 'VP7857', NULL, 1, NULL, 1, '2026-05-06 11:11:24'),
(3, 'Munna kumar', 'test@gmail.com', '7219785445', 'Bihar', '$2b$05$ub76yY1ePayVJ2PiDZ3kguZeEdLBVn85MKlB1s5T3WAqNZjnN.TMa', '123456', 78, 'VP7858', NULL, 0, 'example1@paytm', 1, '2026-05-06 11:11:24'),
(4, 'Test 2', 'test2@gmail.com', '1234567890', 'Delhi', '$2a$10$aP1AEL5/yViUwgpfHM9/Z.G5ernyrjVaXHBzd9FBZy0drTMXB1ay6', '123456', 0, 'VP9377', '', 0, NULL, 1, '2026-05-08 09:14:30'),
(5, 'Test 4', 'test4@gmail.com', '1234567894', 'Delhi', '$2a$10$uCbJ2alEk2Thlw0/z0nhmeoLUPlriI.PjJuZvlG1yAffjPX43o7yO', '123456', 40, 'VP6453', 'VP7858', 0, 'example@paytm', 1, '2026-05-08 10:18:06'),
(6, 'Munna kumar', 'admin@gmail.com', '7219785445', 'Bihar', '$2a$10$UpGzcvlnTav0qzitVn/Fl.TgX996XIewkfupXOeZfCmYbgSuCJsU.', '123456', 99, 'VP7850', NULL, 1, NULL, 1, '2026-05-06 11:11:24'),
(7, 'Test 5', 'test5@gmail.com', '1234567890', 'Delhi', '$2a$10$rmQWpfjWNHC.zT7fAR9POOgESmyA4QKHMz3p7yOxlFfbxWvmF0R5K', '123456', 2, 'VP4701', 'VP6453', 0, NULL, 1, '2026-05-13 06:12:58'),
(8, 'Test 6', 'test6@gmail.com', '1234567890', 'Delhi', '$2a$10$wKR/dMtO4SFpXjl0hEEi9OW6IDuVwyDK0oIyrc/6uJmDm6xdgTCKG', '123456', 41, 'VP7377', 'VP4701', 0, NULL, 1, '2026-05-13 06:16:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `prompts`
--
ALTER TABLE `prompts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utr_number` (`utr_number`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `unlocks`
--
ALTER TABLE `unlocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `prompt_id` (`prompt_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `referral_code` (`referral_code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `prompts`
--
ALTER TABLE `prompts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `unlocks`
--
ALTER TABLE `unlocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `unlocks`
--
ALTER TABLE `unlocks`
  ADD CONSTRAINT `unlocks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `unlocks_ibfk_2` FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
