# Mobile-First Responsive Design

## 📱 Breakpoints (Tailwind CSS)

```
Mobile:      < 640px   (sm)  - Base styles
Tablet:      640px+    (sm)  - Small tablets
Desktop:     768px+    (md)  - Tablets landscape
Large:       1024px+   (lg)  - Desktops
Extra Large: 1280px+   (xl)  - Large screens
```

## 🎯 Mobile-First Strategy

### ✅ Implemented Optimizations:

#### **App.tsx - Main Layout**
- Reduced padding on mobile: `p-2` → `sm:p-4` → `lg:p-6`
- Responsive header title: `text-2xl` → `md:text-4xl`
- Smaller reset button on mobile

#### **SetupScreen**
- Single column form on mobile
- Two columns on tablet+ (`sm:grid-cols-2`)
- Larger touch targets (minimum 44x44px)
- Responsive padding and text sizes

#### **Dashboard**
- **Mobile**: Ranking table first, then matches (vertical stack)
- **Desktop**: Matches left (2/3), ranking right (1/3)
- Order control: `order-1`, `order-2` with `lg:order-*`

#### **MatchList**
- **Mobile**: Vertical card layout with stacked buttons
- **Tablet+**: Horizontal layout with side-by-side teams
- Flexible button sizing for small screens
- Truncated long team names

#### **RankingTable**
- Horizontal scroll on mobile (preserved table structure)
- Hidden columns on small screens:
  - `hidden sm:table-cell` for Average
  - `hidden md:table-cell` for X+10s
- Compact cell padding on mobile

#### **ScoresheetModal**
- Full-screen modal on mobile (`max-h-[95vh]`)
- Smaller arrow input grid on mobile
- Sticky header and footer
- Responsive set display

#### **PlayoffsBracket**
- Vertical stack on mobile (semifinals → finals → winners)
- Three-column grid on desktop
- Truncated team names with ellipsis
- Smaller medals text on mobile

#### **ScorerPage**
- Optimized for mobile scoring
- Large touch targets for arrow inputs
- Responsive score display
- Better button spacing

## 📏 Design Principles Applied:

### 1. **Touch-Friendly**
- Minimum button size: 44x44px (Apple HIG)
- Adequate spacing between interactive elements
- Large input areas for arrow selection

### 2. **Content Priority**
- Most important info visible first on mobile
- Ranking table before match list on mobile
- Progressive enhancement for larger screens

### 3. **Performance**
- Mobile-first CSS (smaller initial load)
- No unnecessary desktop styles on mobile
- Efficient use of Tailwind utilities

### 4. **Typography**
- Fluid text sizing: `text-sm` → `sm:text-base` → `lg:text-lg`
- Readable on all screen sizes
- Proper line heights and spacing

### 5. **Layout**
- Flexible grids that stack on mobile
- No horizontal scroll (except tables with overflow-x-auto)
- Proper container padding

## 🎨 Visual Hierarchy (Mobile)

```
Priority 1: Scores and Current Match
Priority 2: Rankings and Results
Priority 3: Actions (Buttons)
Priority 4: Detailed Statistics
```

## 🧪 Testing Recommendations:

Test on these viewports:
- 📱 iPhone SE: 375px
- 📱 iPhone 12/13: 390px
- 📱 Pixel 5: 393px
- 📱 Samsung S20: 412px
- 📱 iPad Mini: 768px
- 💻 Desktop: 1024px+

## ✨ Key Mobile Features:

- ✅ Swipeable modals
- ✅ Touch-optimized buttons
- ✅ Readable text sizes
- ✅ No pinch-to-zoom needed
- ✅ Fast tap response
- ✅ Proper meta viewport
- ✅ Apple web app capable
- ✅ Theme color for mobile browsers
