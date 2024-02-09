#include <iostream>
using namespace std;

typedef struct {
    int num1;
    float num2;
    string str1;
} struct1; 

struct1 globalStruct;

void changeStruct() {
    globalStruct.num1 = 100;
    globalStruct.num2 = 100.1010;
    globalStruct.str1 = "Global struct";
}

void printStruct() {
    cout << "num1 = " << globalStruct.num1 << endl;
    cout << "num2 = " << globalStruct.num2 << endl;
    cout << "str1 = " << globalStruct.str1 << endl;
}

int main() {
    // printf("Hello world from printf");
    // cout << "Hello world from cout";
    globalStruct.num1 = 1;
    globalStruct.num2 = -1.1;
    globalStruct.str1 = "Local struct";
    printStruct();
    changeStruct();
    printStruct();
    return 0;
}