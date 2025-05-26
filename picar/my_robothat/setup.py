"""
Setup script for my_robothat library.
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="my-robothat",
    version="0.1.0",
    author="Blockchainnewbie",
    author_email="your.email@example.com",
    description="Modern Hardware Abstraction Library for Robot HAT compatible boards",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Blockchainnewbie/my-robothat",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "RPi.GPIO>=0.7.1",
        "adafruit-circuitpython-busio",
        "adafruit-circuitpython-ads1x15",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=0.990",
        ]
    },
)