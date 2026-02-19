/**
 * ATAS API Knowledge Base for AI Assistant Integration
 * Embedded documentation for frontend-only chat UI
 */

const ATAS_KNOWLEDGE_BASE = {
  // Metadata
  meta: {
    name: "ATAS API Knowledge Base",
    version: "1.0.0",
    description: "LLM-optimized documentation for ATAS indicator and strategy development"
  },

  // Documentation categories
  categories: {
    snippets: {
      name: "Code Snippets",
      icon: "📝",
      description: "Copy-paste ready code blocks for indicators and strategies",
      keywords: ["template", "skeleton", "example", "code", "snippet", "pattern"]
    },
    api: {
      name: "API Reference", 
      icon: "📚",
      description: "Method signatures, properties, and return types",
      keywords: ["method", "property", "class", "function", "signature", "api"]
    },
    mistakes: {
      name: "Common Mistakes",
      icon: "⚠️",
      description: "Anti-patterns and debugging help",
      keywords: ["error", "bug", "wrong", "fix", "debug", "mistake", "problem"]
    },
    glossary: {
      name: "Glossary",
      icon: "📖",
      description: "Trading and ATAS terminology",
      keywords: ["term", "definition", "meaning", "what is", "explain"]
    }
  },

  // Quick prompts for common tasks
  quickPrompts: [
    {
      id: "create-indicator",
      title: "Create Indicator",
      icon: "📊",
      prompt: "Create an ATAS indicator that",
      placeholder: "calculates RSI with custom period..."
    },
    {
      id: "create-strategy",
      title: "Create Strategy",
      icon: "🤖",
      prompt: "Create an ATAS trading strategy that",
      placeholder: "enters long when price crosses above SMA..."
    },
    {
      id: "debug-code",
      title: "Debug Code",
      icon: "🔧",
      prompt: "Debug this ATAS code and explain what's wrong:",
      placeholder: "paste your code here..."
    },
    {
      id: "explain-concept",
      title: "Explain Concept",
      icon: "💡",
      prompt: "Explain this ATAS/trading concept:",
      placeholder: "Delta, POC, Value Area..."
    }
  ],

  // Condensed documentation content
  docs: {
    snippets: `# ATAS Code Snippets

## Indicator Templates

### Minimal Indicator
\`\`\`csharp
using ATAS.Indicators;

[DisplayName("My Indicator")]
public class MyIndicator : Indicator
{
    protected override void OnCalculate(int bar, decimal value)
    {
        this[bar] = GetCandle(bar).Close;
    }
}
\`\`\`

### Standard Indicator with Parameters
\`\`\`csharp
using ATAS.Indicators;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Windows.Media;

[DisplayName("Standard Indicator")]
public class StandardIndicator : Indicator
{
    private int _lastBar = -1;

    [Display(Name = "Period", GroupName = "Settings")]
    [Range(1, 500)]
    public int Period { get; set; } = 14;

    public StandardIndicator() : base(true)
    {
        DenyToChangePanel = true;
        var series = (ValueDataSeries)DataSeries[0];
        series.Color = Colors.Blue;
        series.Width = 2;
    }

    protected override void OnCalculate(int bar, decimal value)
    {
        if (_lastBar == bar) return;
        _lastBar = bar;
        var candle = GetCandle(bar);
        this[bar] = candle.Close;
    }
}
\`\`\`

### Signal Indicator with Arrows
\`\`\`csharp
using ATAS.Indicators;
using System.Windows.Media;

[DisplayName("Signal Indicator")]
public class SignalIndicator : Indicator
{
    private readonly ValueDataSeries _buySignals;
    private readonly ValueDataSeries _sellSignals;

    public SignalIndicator() : base(true)
    {
        DenyToChangePanel = true;
        ((ValueDataSeries)DataSeries[0]).VisualType = VisualMode.Hide;

        _buySignals = new ValueDataSeries("Buy")
        {
            VisualType = VisualMode.UpArrow,
            Color = Colors.Green,
            Width = 2
        };
        _sellSignals = new ValueDataSeries("Sell")
        {
            VisualType = VisualMode.DownArrow,
            Color = Colors.Red,
            Width = 2
        };
        DataSeries.Add(_buySignals);
        DataSeries.Add(_sellSignals);
    }

    protected override void OnCalculate(int bar, decimal value)
    {
        if (bar < 1) return;
        var candle = GetCandle(bar);
        var prev = GetCandle(bar - 1);

        // Buy signal example
        if (candle.Close > candle.Open && prev.Close < prev.Open)
            _buySignals[bar] = candle.Low - 2 * InstrumentInfo.TickSize;

        // Sell signal example  
        if (candle.Close < candle.Open && prev.Close > prev.Open)
            _sellSignals[bar] = candle.High + 2 * InstrumentInfo.TickSize;
    }
}
\`\`\`

## Strategy Templates

### Minimal Strategy
\`\`\`csharp
using ATAS.Strategies.Chart;
using ATAS.DataFeedsCore;

[DisplayName("Minimal Strategy")]
public class MinimalStrategy : ChartStrategy
{
    protected override void OnCalculate(int bar, decimal value)
    {
        if (!CanProcess(bar)) return;
        // Trading logic here
    }
}
\`\`\`

### Strategy with TP/SL
\`\`\`csharp
using ATAS.Strategies.Chart;
using ATAS.DataFeedsCore;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

[DisplayName("Standard Strategy")]
public class StandardStrategy : ChartStrategy
{
    private int _lastBar = -1;
    private bool _orderPending = false;

    [Display(Name = "Volume"), Parameter]
    public decimal Volume { get; set; } = 1;

    [Display(Name = "Take Profit (Ticks)"), Parameter]
    public int TakeProfit { get; set; } = 20;

    [Display(Name = "Stop Loss (Ticks)"), Parameter]
    public int StopLoss { get; set; } = 10;

    protected override void OnCalculate(int bar, decimal value)
    {
        if (_lastBar == bar) return;
        _lastBar = bar;
        if (!CanProcess(bar) || _orderPending) return;
        // Entry logic here
    }

    protected override void OnCurrentPositionChanged()
    {
        _orderPending = false;
        if (CurrentPosition != 0) SetTPSL();
    }

    private void SetTPSL()
    {
        CancelAllOrders();
        if (CurrentPosition == 0) return;

        bool isLong = CurrentPosition > 0;
        decimal qty = Math.Abs(CurrentPosition);

        var tp = new Order
        {
            Portfolio = Portfolio, Security = Security,
            Type = OrderTypes.Limit,
            Direction = isLong ? OrderDirections.Sell : OrderDirections.Buy,
            Price = AveragePrice + TakeProfit * Security.TickSize * (isLong ? 1 : -1),
            QuantityToFill = qty, Comment = "TP"
        };

        var sl = new Order
        {
            Portfolio = Portfolio, Security = Security,
            Type = OrderTypes.Stop,
            Direction = isLong ? OrderDirections.Sell : OrderDirections.Buy,
            TriggerPrice = AveragePrice - StopLoss * Security.TickSize * (isLong ? 1 : -1),
            QuantityToFill = qty, Comment = "SL"
        };

        OpenOcoOrder(tp, sl);
    }

    private void CancelAllOrders()
    {
        foreach (var order in Orders.Where(o => o.State == OrderStates.Active).ToList())
            CancelOrder(order);
    }
}
\`\`\`

## Order Patterns

### Market Order
\`\`\`csharp
var order = new Order
{
    Portfolio = Portfolio,
    Security = Security,
    Direction = OrderDirections.Buy, // or Sell
    Type = OrderTypes.Market,
    QuantityToFill = 1,
    Comment = "Entry"
};
OpenOrder(order);
\`\`\`

### Limit Order
\`\`\`csharp
var order = new Order
{
    Portfolio = Portfolio,
    Security = Security,
    Direction = OrderDirections.Buy,
    Type = OrderTypes.Limit,
    Price = 4500.00m,  // Use Price for Limit
    QuantityToFill = 1
};
OpenOrder(order);
\`\`\`

### Stop Order
\`\`\`csharp
var order = new Order
{
    Portfolio = Portfolio,
    Security = Security,
    Direction = OrderDirections.Sell,
    Type = OrderTypes.Stop,
    TriggerPrice = 4480.00m,  // Use TriggerPrice for Stop!
    QuantityToFill = 1
};
OpenOrder(order);
\`\`\`

## Calculation Patterns

### Skip Duplicate Bar Processing
\`\`\`csharp
private int _lastBar = -1;

protected override void OnCalculate(int bar, decimal value)
{
    if (_lastBar == bar) return;
    _lastBar = bar;
    // Your logic here
}
\`\`\`

### Simple Moving Average
\`\`\`csharp
private decimal CalculateSMA(int bar, int period)
{
    if (bar < period - 1) return 0;
    decimal sum = 0;
    for (int i = 0; i < period; i++)
        sum += GetCandle(bar - i).Close;
    return sum / period;
}
\`\`\`

### Crossover Detection
\`\`\`csharp
private bool IsCrossover(int bar, ValueDataSeries fast, ValueDataSeries slow)
{
    if (bar < 1) return false;
    return fast[bar - 1] < slow[bar - 1] && fast[bar] >= slow[bar];
}
\`\`\``,

    api: `# ATAS API Reference

## Base Classes

| Task | Base Class |
|------|------------|
| Create indicator | \`Indicator\` |
| Create trading strategy | \`ChartStrategy\` |

## Indicator Class

### Key Properties
| Property | Type | Description |
|----------|------|-------------|
| \`CurrentBar\` | int | Total number of bars |
| \`InstrumentInfo\` | IInstrumentInfo | Instrument details |
| \`ChartInfo\` | IChartInfo | Chart rendering info |
| \`DataSeries\` | DataSeriesCollection | Output series |
| \`DenyToChangePanel\` | bool | Lock to price panel |

### Key Methods
| Method | Description |
|--------|-------------|
| \`GetCandle(int bar)\` | Get candle at bar index |
| \`Add(Indicator)\` | Add child indicator |

### Lifecycle Methods
| Method | When Called |
|--------|-------------|
| \`OnInitialize()\` | Once when added |
| \`OnCalculate(int bar, decimal value)\` | For each bar/tick |

## ChartStrategy Class

### Key Properties
| Property | Type | Description |
|----------|------|-------------|
| \`CurrentPosition\` | decimal | Current position (+long, -short) |
| \`AveragePrice\` | decimal | Average entry price |
| \`Portfolio\` | Portfolio | Trading account |
| \`Security\` | Security | Instrument |
| \`Orders\` | IEnumerable<Order> | All orders |

### Order Methods
| Method | Description |
|--------|-------------|
| \`OpenOrder(Order)\` | Place single order |
| \`OpenOcoOrder(Order, Order)\` | Place OCO pair |
| \`CancelOrder(Order)\` | Cancel order |
| \`CanProcess(int bar)\` | Check if can trade |

### Strategy Events
| Method | When Called |
|--------|-------------|
| \`OnCurrentPositionChanged()\` | Position changes |
| \`OnOrderChanged(Order)\` | Order state changes |
| \`OnStopping()\` | Before stopping |

## Order Class

### Required Properties
| Property | Type | Description |
|----------|------|-------------|
| \`Portfolio\` | Portfolio | Trading account |
| \`Security\` | Security | Instrument |
| \`Direction\` | OrderDirections | Buy/Sell |
| \`Type\` | OrderTypes | Market/Limit/Stop |
| \`QuantityToFill\` | decimal | Order size |
| \`Price\` | decimal | For Limit orders |
| \`TriggerPrice\` | decimal | For Stop orders |

## Candle Properties
| Property | Type |
|----------|------|
| \`Open\` | decimal |
| \`High\` | decimal |
| \`Low\` | decimal |
| \`Close\` | decimal |
| \`Volume\` | decimal |
| \`Delta\` | decimal |
| \`Time\` | DateTime |

## Enums

### OrderTypes
\`\`\`csharp
OrderTypes.Market  // Execute at market
OrderTypes.Limit   // Execute at Price or better
OrderTypes.Stop    // Trigger at TriggerPrice
\`\`\`

### OrderStates
\`\`\`csharp
OrderStates.Pending   // Submitted
OrderStates.Active    // Working
OrderStates.Done      // Filled
OrderStates.Cancelled // Cancelled
OrderStates.Failed    // Failed
\`\`\`

### VisualMode
\`\`\`csharp
VisualMode.Line      // Continuous line
VisualMode.Histogram // Vertical bars
VisualMode.UpArrow   // Up arrow
VisualMode.DownArrow // Down arrow
VisualMode.Hide      // Hidden
\`\`\`

## Required Using Statements
\`\`\`csharp
using ATAS.Indicators;
using ATAS.Indicators.Technical;
using ATAS.Strategies.Chart;
using ATAS.DataFeedsCore;
using System.Windows.Media;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
\`\`\``,

    mistakes: `# Common Mistakes

## Order Mistakes

### ❌ Using Price for Stop Orders
**WRONG:**
\`\`\`csharp
Type = OrderTypes.Stop,
Price = 4480.00m  // WRONG!
\`\`\`

**CORRECT:**
\`\`\`csharp
Type = OrderTypes.Stop,
TriggerPrice = 4480.00m  // CORRECT
\`\`\`

### ❌ Checking Position After Order
**WRONG:**
\`\`\`csharp
OpenOrder(buyOrder);
if (CurrentPosition > 0) SetTPSL(); // Position not updated yet!
\`\`\`

**CORRECT:**
\`\`\`csharp
OpenOrder(buyOrder);

protected override void OnCurrentPositionChanged()
{
    if (CurrentPosition != 0) SetTPSL();
}
\`\`\`

### ❌ Wrong Direction for TP/SL
To close a position, use the OPPOSITE direction:
\`\`\`csharp
bool isLong = CurrentPosition > 0;
Direction = isLong ? OrderDirections.Sell : OrderDirections.Buy
\`\`\`

## Indicator Mistakes

### ❌ Forgetting Add() for Child Indicators
**WRONG:**
\`\`\`csharp
private readonly SMA _sma = new SMA { Period = 14 };
// _sma[bar] is always 0!
\`\`\`

**CORRECT:**
\`\`\`csharp
public MyIndicator()
{
    Add(_sma);  // REQUIRED!
}
\`\`\`

### ❌ Processing Same Bar Multiple Times
**CORRECT:**
\`\`\`csharp
private int _lastBar = -1;

protected override void OnCalculate(int bar, decimal value)
{
    if (_lastBar == bar) return;
    _lastBar = bar;
    // Logic here
}
\`\`\`

### ❌ Negative Bar Index
**CORRECT:**
\`\`\`csharp
if (bar < 1) return;
var prevCandle = GetCandle(bar - 1);
\`\`\`

## Strategy Mistakes

### ❌ Not Using CanProcess()
**CORRECT:**
\`\`\`csharp
protected override void OnCalculate(int bar, decimal value)
{
    if (!CanProcess(bar)) return;
    // Trading logic
}
\`\`\`

### ❌ Multiple Entries Without State Tracking
**CORRECT:**
\`\`\`csharp
private bool _orderPending = false;

if (_orderPending) return;
_orderPending = true;
OpenOrder(order);

protected override void OnCurrentPositionChanged()
{
    _orderPending = false;
}
\`\`\`

### ❌ Wrong Base Class
Use \`ChartStrategy\` for chart strategies, NOT \`Strategy\`.

## Quick Checklist

### Orders
- [ ] Stop orders use \`TriggerPrice\`
- [ ] Limit orders use \`Price\`
- [ ] TP/SL direction is opposite to position
- [ ] Using \`.ToList()\` when iterating Orders

### Indicators
- [ ] Child indicators added with \`Add()\`
- [ ] Duplicate bar processing prevented
- [ ] No negative bar access

### Strategies
- [ ] \`CanProcess(bar)\` check
- [ ] Order state tracking
- [ ] Extends \`ChartStrategy\`
- [ ] TP/SL set in event handler`,

    glossary: `# ATAS Glossary

## Core Concepts

| Term | Definition |
|------|------------|
| **Bar** | Single candlestick, index starts at 0 |
| **CurrentBar** | Total bars on chart |
| **TickSize** | Minimum price increment |
| **TickCost** | Dollar value per tick |

## Price Data

| Term | Definition |
|------|------------|
| **OHLC** | Open, High, Low, Close |
| **Delta** | Buy volume - Sell volume |
| **POC** | Point of Control (highest volume price) |
| **VAH/VAL** | Value Area High/Low |
| **VWAP** | Volume Weighted Average Price |

## Order Types

| Type | Description |
|------|-------------|
| **Market** | Execute immediately |
| **Limit** | Execute at Price or better |
| **Stop** | Trigger at TriggerPrice |
| **OCO** | One Cancels Other |

## Position Terms

| Term | Definition |
|------|------------|
| **Long** | Buy to profit from price increase |
| **Short** | Sell to profit from decrease |
| **Flat** | No position (CurrentPosition == 0) |
| **TP** | Take Profit (limit order) |
| **SL** | Stop Loss (stop order) |

## Market Profile

| Term | Definition |
|------|------------|
| **Single Prints** | Levels visited once (institutional) |
| **Tail** | Strong rejection wick |
| **Poor High/Low** | Weak structure, likely revisited |
| **OTF** | Other Time Frame (institutional) |

## Order Flow

| Term | Definition |
|------|------------|
| **Absorption** | Large orders absorbing aggression |
| **Imbalance** | Unequal buy/sell pressure |
| **Exhaustion** | Momentum depletion |

## Technical Indicators

| Term | Definition |
|------|------------|
| **SMA** | Simple Moving Average |
| **EMA** | Exponential Moving Average |
| **RSI** | Relative Strength Index |
| **ATR** | Average True Range |
| **SuperTrend** | ATR-based trend indicator |

## Session Terms

| Term | Definition |
|------|------------|
| **RTH** | Regular Trading Hours |
| **ETH** | Extended Trading Hours |
| **IR** | Initial Range (first 30 min) |
| **DH/DL** | Daily High/Low |

## Code Terms

| Term | Definition |
|------|------------|
| **DataSeries** | Array storing indicator values |
| **VisualMode** | Display type (Line, Histogram, Arrow) |
| **Period** | Lookback length |
| **Crossover** | Line crossing above another |

## Class Types

| Class | Use For |
|-------|---------|
| **Indicator** | Custom indicators |
| **ChartStrategy** | Trading strategies |
| **Order** | Trade orders |

## Common Abbreviations

| Abbr | Meaning |
|------|---------|
| TP | Take Profit |
| SL | Stop Loss |
| BE | Breakeven |
| OCO | One Cancels Other |
| ATM | Automatic Trade Management |
| CRV | Risk-Reward Ratio |`
  },

  // System prompt for AI assistants
  systemPrompt: `You are an expert ATAS platform developer assistant. You help users create indicators and trading strategies for the ATAS trading platform.

Key Rules:
1. Always use the correct base class: Indicator for indicators, ChartStrategy for strategies
2. Stop orders use TriggerPrice, Limit orders use Price
3. Always add child indicators with Add()
4. Use CanProcess(bar) before trading logic
5. Handle position changes in OnCurrentPositionChanged()
6. Prevent duplicate bar processing with _lastBar check

When generating code:
- Include all necessary using statements
- Add proper attributes ([DisplayName], [Display], [Parameter])
- Implement error checking and null guards
- Follow ATAS best practices`,

  // Generate full prompt with context
  generatePrompt: function(userQuestion, category = 'all') {
    let context = this.systemPrompt + "\n\n";
    
    if (category === 'all') {
      context += "=== REFERENCE DOCUMENTATION ===\n\n";
      context += this.docs.snippets + "\n\n";
      context += this.docs.api + "\n\n";
      context += this.docs.mistakes + "\n\n";
    } else if (this.docs[category]) {
      context += `=== ${this.categories[category]?.name || category.toUpperCase()} ===\n\n`;
      context += this.docs[category] + "\n\n";
    }
    
    context += "=== USER QUESTION ===\n\n";
    context += userQuestion;
    
    return context;
  }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ATAS_KNOWLEDGE_BASE;
}
