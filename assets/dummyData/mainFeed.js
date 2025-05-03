export const DATA = [
  
    {
      id: '1',
      title: 'Introduction to React Native: Building Native Mobile Apps with JavaScript',
      author: 'Adrian Rainier Fabian',
      date: 'February 14, 2025 at 9:04 AM',
      content:
        '# What is React Native?\n\n**React Native (RN)** has revolutionized mobile app development by allowing developers to use their existing JavaScript knowledge to build *truly native* iOS and Android applications. Unlike hybrid apps that run in a WebView, React Native components compile down to native UI elements, resulting in excellent performance and a native look and feel.\n\n## Core Concepts\n\nThis introduction covers the core concepts of React Native, its architecture, and the benefits of choosing it for your next mobile project. We\'ll touch upon components, JSX, state management (briefly), and how it interacts with native modules.\n\n**[Image Placeholder: React Native Logo]**',
      likes: 23,
      comments: 23,
      shares: 7,
      image: 'https://reactnative.dev/img/tiny_logo.png', // Still keeping the original image URL
      tag: 'Mobile Development',
      floatingNotes: [
        {
          id: '1',
          text: '*Excited* to learn RN!',
          emoji: '📱',
          profileImage: 'https://i.pravatar.cc/150?img=1',
        },
      ],
    },
    {
      id: '2',
      title: 'Mastering Advanced TypeScript Patterns for Robust JavaScript Development',
      author: 'Jessica Chen',
      date: 'February 16, 2025 at 2:30 PM',
      content:
        '# Advanced TypeScript\n\nTypeScript takes JavaScript development to the next level by introducing **static typing**. This allows for catching errors during development rather than at runtime, leading to more robust and maintainable codebases.\n\n## Key Patterns\n\nBeyond basic types, TypeScript offers powerful advanced patterns such as generics, utility types (e.g., `Partial`, `Required`, `Readonly`), conditional types, and mapped types. Understanding and utilizing these patterns can significantly improve code quality, enhance tooling support, and provide better documentation through type inference.\n\n**[Image Placeholder: TypeScript Logo]**',
      likes: 47,
      comments: 12,
      shares: 15,
      image: 'https://picsum.photos/id/0/800/600', // Still keeping the original image URL
      tag: 'Web Development',
      floatingNotes: [
        {
          id: '1',
          text: '**Type safety** is a game-changer!',
          emoji: '🔒',
          profileImage: 'https://i.pravatar.cc/150?img=5',
        },
        {
          id: '2',
          text: 'Really *digging* TypeScript!',
          emoji: '❤️',
          profileImage: 'https://i.pravatar.cc/150?img=10',
        },
      ],
    },
    {
      id: '3',
      title: 'Unlocking Rapid UI Development with Tailwind CSS: A Utility-First Approach',
      author: 'Marcus Johnson',
      date: 'February 18, 2025 at 11:15 AM',
      content:
        '# Tailwind CSS Explained\n\n**Tailwind CSS** offers a unique approach to styling web applications. Instead of writing custom CSS for every element, you compose your designs by applying pre-defined utility classes directly in your HTML. This utility-first methodology can drastically speed up UI development, ensure consistency across your project, and make styling more intuitive.\n\n## Benefits of Utility-First\n\nThis article explores the core concepts of Tailwind, its configuration options, and how to leverage its extensive set of utility classes to build beautiful and responsive user interfaces without ever writing a single line of custom CSS.\n\n**[Image Placeholder: Tailwind CSS Logo]**',
      likes: 89,
      comments: 34,
      shares: 28,
      image: 'https://picsum.photos/id/1/800/600', // Still keeping the original image URL
      tag: 'Frontend Design',
      backgroundColor: '#0ea5e9',
      floatingNotes: [
        {
          id: '1',
          text: 'Tailwind is a UI development *game changer*!',
          emoji: '🎨',
          profileImage: 'https://i.pravatar.cc/150?img=12',
        },
        {
          id: '2',
          text: 'Find Tailwind **incredibly useful** for rapid prototyping.',
          emoji: '👍',
          profileImage: 'https://i.pravatar.cc/150?img=20',
        },
        {
          id: '3',
          text: 'Everyone should *try* Tailwind!',
          emoji: '✨',
          profileImage: 'https://i.pravatar.cc/150?img=30',
        },
      ],
    },
    {
      id: '4',
      title: 'Streamlining State Management in React with Redux Toolkit',
      author: 'Sophia Williams',
      date: 'February 20, 2025 at 4:45 PM',
      content:
        '# Introduction to Redux Toolkit\n\n**Redux** has long been a popular choice for managing complex application state in React. However, setting up and working with Redux could often involve a significant amount of boilerplate code. **Redux Toolkit** is designed to simplify this process. It provides a set of utilities and conventions that make Redux development more efficient and less verbose.\n\n## Key Features\n\nThis guide introduces the key features of Redux Toolkit, such as `createSlice`, `configureStore`, and `createAsyncThunk`, demonstrating how they can help you write cleaner and more maintainable Redux code.\n\n**[Image Placeholder: Redux Toolkit Logo]**',
      likes: 62,
      comments: 18,
      shares: 11,
      image: 'https://picsum.photos/id/4/800/600', // Still keeping the original image URL
      tag: 'State Management',
      floatingNotes: [
        {
          id: '1',
          text: 'Redux Toolkit has *simplified* state management so much!',
          emoji: '⚛️',
          profileImage: 'https://i.pravatar.cc/150?img=25',
        },
      ],
    },
    {
      id: '5',
      title: 'The Core Principles of Responsive Design for Multi-Device Applications',
      author: 'David Rodriguez',
      date: 'February 22, 2025 at 10:20 AM',
      content:
        '# Understanding Responsive Design\n\nIn today\'s multi-device world, ensuring your application looks and functions flawlessly across a wide range of screen sizes and resolutions is **crucial**. Responsive design is an approach to web and application development that aims to create flexible and adaptable layouts.\n\n## Core Principles\n\nThis article delves into the fundamental principles of responsive design, including fluid grids, flexible images, and media queries. We\'ll explore how to implement these techniques to provide an optimal user experience on desktops, tablets, and mobile phones alike.\n\n**[Image Placeholder: Responsive Design Illustration]**',
      likes: 105,
      comments: 27,
      shares: 32,
      image: 'https://picsum.photos/id/24/800/600', // Still keeping the original image URL
      tag: 'UI/UX Design',
      floatingNotes: [],
    },
    {
      id: '6',
      title: 'Kickstarting Your Journey with Next.js: Server-Side Rendering and Beyond',
      author: 'Emma Thompson',
      date: 'February 24, 2025 at 3:10 PM',
      content:
        '# Getting Started with Next.js\n\n**Next.js** has emerged as a powerful framework for building production-ready React applications. It offers features like **server-side rendering (SSR)** and **static site generation (SSG)** out of the box, which can significantly improve performance and SEO.\n\n## Key Features and Benefits\n\nThis guide provides a gentle introduction to Next.js, covering its core concepts, project setup, routing system, data fetching strategies, and the benefits of leveraging its server-side capabilities for building fast and scalable web applications.\n\n**[Image Placeholder: Next.js Logo]**',
      likes: 78,
      comments: 31,
      shares: 19,
      image: 'https://picsum.photos/id/6/800/600', // Still keeping the original image URL
      tag: 'React Framework',
      backgroundColor: '#8b5cf6',
      floatingNotes: [
        {
          id: '1',
          text: 'Next.js feels like the *future* of React development!',
          emoji: '🚀',
          profileImage: 'https://i.pravatar.cc/150?img=20',
        },
      ],
    },
    {
      id: '7',
      title: 'The Importance of Accessibility in Web Applications: Building Inclusive Experiences',
      author: 'James Wilson',
      date: 'February 26, 2025 at 1:25 PM',
      content:
        '# Why Accessibility Matters\n\n**Accessibility** (often abbreviated as A11y) is a *critical* aspect of web development that ensures your applications are usable by everyone, including individuals with disabilities. This is not just about compliance; it\'s about creating **inclusive experiences**.\n\n## Key Considerations\n\nThis article highlights key accessibility considerations, such as semantic HTML, ARIA attributes, keyboard navigation, color contrast, and screen reader compatibility. By prioritizing accessibility, you can broaden your audience and uphold ethical development practices.\n\n**[Image Placeholder: Accessibility Icon]**',
      likes: 93,
      comments: 42,
      shares: 27,
      image: 'https://picsum.photos/id/60/800/600', // Still keeping the original image URL
      tag: 'Accessibility',
      floatingNotes: [
        {
          id: '1',
          text: 'Web accessibility is about *inclusion* for everyone.',
          emoji: '♿',
          profileImage: 'https://i.pravatar.cc/150?img=25',
        },
        {
          id: '2',
          text: 'Making apps **accessible** is incredibly important.',
          emoji: '⭐',
          profileImage: 'https://i.pravatar.cc/150?img=25',
        },
      ],
    },
    {
      id: '8',
      title: 'Essential Performance Optimization Techniques for Modern Web Applications',
      author: 'Olivia Martinez',
      date: 'February 28, 2025 at 9:50 AM',
      content:
        '# Optimizing Web Application Performance\n\nIn today\'s fast-paced digital environment, **performance** is *paramount* for user satisfaction and the success of your web applications. Slow-loading or unresponsive apps can lead to frustration and high bounce rates.\n\n## Optimization Techniques\n\nThis article explores various techniques for optimizing the performance of modern web applications, including code splitting, lazy loading, image optimization, caching strategies, and minimizing unnecessary rendering. Implementing these strategies can significantly improve your application\'s speed and responsiveness.\n\n**[Image Placeholder: Performance Optimization Graph]**',
      likes: 116,
      comments: 29,
      shares: 41,
      image: 'https://picsum.photos/id/8/800/600', // Still keeping the original image URL
      tag: 'Performance',
      backgroundColor: '#10b981',
      floatingNotes: [],
    },
];
