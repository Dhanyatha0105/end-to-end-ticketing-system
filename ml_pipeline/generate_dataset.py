import pandas as pd
import random

def generate_synthetic_data(num_samples=1000):
    data = []
    
    categories = ['Bug', 'Feature', 'System Issue', 'Inquiry']
    
    templates = {
        'Bug': [
            ("The {} button is not working on the main page.", 'Medium'),
            ("Application crashes when I click {}.", 'High'),
            ("UI is misaligned at {}.", 'Low'),
            ("I keep getting a {} error during checkout.", 'High')
        ],
        'Feature': [
            ("We need a new {} for the dashboard.", 'Medium'),
            ("Please add support for {} in the next release.", 'Low'),
            ("Option to export {} as PDF.", 'Low')
        ],
        'System Issue': [
            ("Database connection timeout at {}.", 'Critical'),
            ("Server {} is down and unresponsive.", 'Critical'),
            ("High latency observed in {} API.", 'High'),
            ("Out of memory error in worker {}.", 'Critical')
        ],
        'Inquiry': [
            ("How do I configure {}?", 'Low'),
            ("Where can I find documentation for {}?", 'Low'),
            ("What is the limit for {}?", 'Low')
        ]
    }
    
    fillers = ['login', 'dashboard', 'settings', 'profile', 'payment gateway', 'auth server', 'module X', 'reports', 'dark mode']
    
    for _ in range(num_samples):
        cat = random.choice(categories)
        template, priority = random.choice(templates[cat])
        
        # occasionally override priority for variance
        if random.random() < 0.1:
            priority = random.choice(['Low', 'Medium', 'High', 'Critical'])
            
        desc = template.format(random.choice(fillers))
        
        data.append({
            'description': desc,
            'category': cat,
            'priority': priority
        })
        
    df = pd.DataFrame(data)
    df.to_csv('synthetic_tickets.csv', index=False)
    print(f"Generated {num_samples} samples into synthetic_tickets.csv")

if __name__ == '__main__':
    generate_synthetic_data(1500)
